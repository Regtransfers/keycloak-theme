package uk.regtransfers.keycloak.verifyemail;

import org.keycloak.models.KeycloakSession;
import org.keycloak.services.resource.RealmResourceProvider;

public class VerifyEmailStatusResourceProvider implements RealmResourceProvider {

    private final KeycloakSession session;

    public VerifyEmailStatusResourceProvider(KeycloakSession session) {
        this.session = session;
    }

    @Override
    public Object getResource() {
        return new VerifyEmailStatusResource(session);
    }

    @Override
    public void close() {
        // No per-request resources to release.
    }
}
