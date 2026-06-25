package uk.regtransfers.keycloak.verifyemail;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import org.keycloak.models.ClientModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.representations.JsonWebToken;
import org.keycloak.services.managers.AuthenticationManager;
import org.keycloak.services.managers.AuthenticationSessionManager;
import org.keycloak.sessions.AuthenticationSessionModel;
import org.keycloak.sessions.RootAuthenticationSessionModel;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * JAX-RS resource backing {@code GET /realms/{realm}/verify-email/status}.
 *
 * <p>The caller is the un-authenticated browser tab sat on the "verify your
 * email" page. We never trust a user id from the request. Instead:
 *
 * <ol>
 *   <li>On the first poll the tab's authentication session is still alive, so we
 *       resolve the attached user from the {@code AUTH_SESSION_ID} cookie plus
 *       the {@code tab_id}/{@code client_id} from the page URL, and hand back a
 *       short-lived, realm-signed {@code token} carrying only that user id.</li>
 *   <li>On subsequent polls the tab sends that token back. This survives the
 *       authentication session being consumed (which happens the moment
 *       verification completes in the same browser) and works across devices.</li>
 * </ol>
 *
 * <p>The token is signed with the realm keys (unforgeable), expires quickly, and
 * only ever lets the holder read a single boolean about their own registration.
 */
public class VerifyEmailStatusResource {

    private static final String TOKEN_TYPE = "verify-email-status";
    private static final long TOKEN_TTL_SECONDS = 900L; // 15 minutes

    private final KeycloakSession session;

    public VerifyEmailStatusResource(KeycloakSession session) {
        this.session = session;
    }

    @GET
    @Path("status")
    @Produces(MediaType.APPLICATION_JSON)
    public Response status(@QueryParam("client_id") String clientId,
                           @QueryParam("tab_id") String tabId,
                           @QueryParam("token") String token) {
        RealmModel realm = session.getContext().getRealm();

        String userId = null;
        String source = "none";

        if (realm != null) {
            // Durable path: a token we minted earlier — independent of the
            // authentication session's lifetime.
            if (token != null) {
                userId = userIdFromToken(token);
                if (userId != null) {
                    source = "token";
                }
            }
            // First poll: resolve from the live authentication session.
            if (userId == null) {
                UserModel user = userFromAuthSession(realm, clientId, tabId);
                if (user != null) {
                    userId = user.getId();
                    source = "authSession";
                }
            }
            // Same-browser, already logged in: fall back to the SSO identity cookie.
            if (userId == null) {
                UserModel user = userFromIdentityCookie(realm);
                if (user != null) {
                    userId = user.getId();
                    source = "identityCookie";
                }
            }
        }

        boolean verified = false;
        String issuedToken = "token".equals(source) ? token : null;

        if (realm != null && userId != null) {
            UserModel current = session.users().getUserById(realm, userId);
            verified = current != null && current.isEmailVerified();
            if (issuedToken == null) {
                issuedToken = mintToken(userId);
            }
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("verified", verified);
        body.put("source", source); // diagnostic only; booleans/strings, no PII
        if (issuedToken != null) {
            body.put("token", issuedToken);
        }

        return Response.ok(body).header("Cache-Control", "no-store").build();
    }

    private UserModel userFromAuthSession(RealmModel realm, String clientId, String tabId) {
        if (clientId == null || tabId == null) {
            return null;
        }

        RootAuthenticationSessionModel rootAuthSession =
                new AuthenticationSessionManager(session).getCurrentRootAuthenticationSession(realm);
        if (rootAuthSession == null) {
            return null;
        }

        ClientModel client = realm.getClientByClientId(clientId);
        if (client == null) {
            return null;
        }

        AuthenticationSessionModel authSession = rootAuthSession.getAuthenticationSession(client, tabId);
        return authSession == null ? null : authSession.getAuthenticatedUser();
    }

    private UserModel userFromIdentityCookie(RealmModel realm) {
        AuthenticationManager.AuthResult authResult =
                new AuthenticationManager().authenticateIdentityCookie(session, realm);
        return authResult == null ? null : authResult.user();
    }

    private String mintToken(String userId) {
        JsonWebToken token = new JsonWebToken();
        token.type(TOKEN_TYPE);
        token.subject(userId);
        token.exp((System.currentTimeMillis() / 1000L) + TOKEN_TTL_SECONDS);
        return session.tokens().encode(token);
    }

    private String userIdFromToken(String token) {
        try {
            JsonWebToken decoded = session.tokens().decode(token, JsonWebToken.class);
            if (decoded == null || !decoded.isActive() || !TOKEN_TYPE.equals(decoded.getType())) {
                return null;
            }
            return decoded.getSubject();
        } catch (RuntimeException e) {
            return null;
        }
    }
}
