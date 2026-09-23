import { useI18n } from "../i18n/index.js";
import { PageContainer, Section, EmptyState } from "../design-system/index.js";

/*
  Batch 6: EXALT Card, provider-ready-only. Confirmed by search: zero
  Card infrastructure exists anywhere in this codebase, frontend or
  backend - no PAN, CVV, expiry, balance, issuer, or status is
  fabricated here, because none of that exists to fabricate. This
  page exists only to show the honest, real state: a provider
  integration is required before this feature can do anything.
*/

function ExaltCard() {
  const { t } = useI18n();

  const translateWithFallback = (key, fallback, namespace = "common") => {
    try {
      const value = t(key, { ns: namespace, defaultValue: fallback });
      return value === undefined || value === null || value === key
        ? fallback
        : value;
    } catch (error) {
      return fallback;
    }
  };

  return (
    <PageContainer maxWidth="700px">
      <Section title={translateWithFallback("exaltCard", "EXALT Card")}>
        <EmptyState
          title={translateWithFallback(
            "cardProviderRequired",
            "Provider integration required"
          )}
          description={translateWithFallback(
            "cardProviderRequiredDescription",
            "The EXALT Card is not yet available. A real card-issuing provider must be connected before this feature can be used."
          )}
        />
      </Section>
    </PageContainer>
  );
}

export default ExaltCard;
