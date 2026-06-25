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
import org.keycloak.services.managers.AuthenticationManager;
import org.keycloak.services.managers.AuthenticationSessionManager;
import org.keycloak.sessions.AuthenticationSessionModel;
import org.keycloak.sessions.RootAuthenticationSessionModel;

import java.util.Collections;

/**
 * JAX-RS resource backing {@code GET /realms/{realm}/verify-email/status}.
 *
 * <p>The caller is the un-authenticated browser tab that is sat on the
 * "verify your email" page. It cannot be trusted to tell us who it is, so we
 * never accept a user id from the request. Instead we resolve the caller's own
 * in-progress authentication session from the {@code AUTH_SESSION_ID} cookie
 * (sent automatically, same-origin) plus the {@code tab_id}/{@code client_id}
 * already present in the page URL. From that session we read the attached user
 * and report whether their email is now verified.
 *
 * <p>This only ever reveals a single boolean about the caller's *own* pending
 * registration, so there is no user enumeration or PII exposure.
 */
public class VerifyEmailStatusResource {

    private final KeycloakSession session;

    public VerifyEmailStatusResource(KeycloakSession session) {
        this.session = session;
    }

    @GET
    @Path("status")
    @Produces(MediaType.APPLICATION_JSON)
    public Response status(@QueryParam("client_id") String clientId,
                           @QueryParam("tab_id") String tabId) {
        boolean verified = isVerified(clientId, tabId);
        return Response.ok(Collections.singletonMap("verified", verified))
                .header("Cache-Control", "no-store")
                .build();
    }

    private boolean isVerified(String clientId, String tabId) {
        RealmModel realm = session.getContext().getRealm();
        if (realm == null) {
            return false;
        }

        // (1) Cross-device case: the waiting tab's authentication session is
        // still alive here; the user record was flipped to verified when the
        // link was followed on another device.
        UserModel user = userFromAuthSession(realm, clientId, tabId);

        // (2) Same-browser case: following the link in another tab completed the
        // flow and consumed the authentication session, but left an SSO identity
        // cookie we can read instead.
        if (user == null) {
            user = userFromIdentityCookie(realm);
        }

        if (user == null) {
            return false;
        }

        // Re-read through the user provider so we observe the freshly-persisted
        // emailVerified flag rather than anything cached on the session models.
        UserModel current = session.users().getUserById(realm, user.getId());
        return current != null && current.isEmailVerified();
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
}
