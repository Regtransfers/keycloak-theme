package uk.regtransfers.keycloak.verifyemail;

import org.keycloak.Config;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.services.resource.RealmResourceProvider;
import org.keycloak.services.resource.RealmResourceProviderFactory;

/**
 * Registers the {@code verify-email} realm resource, exposing the status check at
 * {@code /realms/{realm}/verify-email/status}.
 */
public class VerifyEmailStatusResourceProviderFactory implements RealmResourceProviderFactory {

    public static final String ID = "verify-email";

    @Override
    public RealmResourceProvider create(KeycloakSession session) {
        return new VerifyEmailStatusResourceProvider(session);
    }

    @Override
    public void init(Config.Scope config) {
        // Nothing to configure.
    }

    @Override
    public void postInit(KeycloakSessionFactory factory) {
        // Nothing to initialise.
    }

    @Override
    public void close() {
        // Nothing to release.
    }

    @Override
    public String getId() {
        return ID;
    }
}
