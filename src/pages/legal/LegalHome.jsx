import LegalLayout from "./LegalLayout";
import FAQSchema from "../../components/SEO/FAQSchema";

const LEGAL_FAQS = [
  {
    question: "What is the Exalt Exchange Legal Center?",
    answer:
      "The Exalt Exchange Legal Center provides access to official policies, compliance standards, legal documents, risk disclosures, and user protection information.",
  },
  {
    question: "Why should users review these legal documents?",
    answer:
      "These documents explain user rights, responsibilities, privacy protections, identity verification requirements, trading risks, and platform policies before using Exalt Exchange services.",
  },
  {
    question: "Which legal policies are available?",
    answer:
      "Users can review the Privacy Policy, Terms of Service, AML Policy, KYC Policy, Risk Disclosure, Cookie Policy, Refund Policy, and Compliance Statement.",
  },
  {
    question: "Can Exalt Exchange update its legal policies?",
    answer:
      "Yes. Exalt Exchange may update its legal policies to reflect regulatory requirements, platform changes, security standards, and improvements in transparency.",
  },
];

function LegalHome() {
  return (
    <LegalLayout title="Legal Center">
      <FAQSchema questions={LEGAL_FAQS} />

      <p>
        Welcome to the Exalt Exchange Legal Center. Here you can review our
        policies, terms, compliance standards, risk disclosures, and user
        protection information.
      </p>

      <h2>Legal Documents</h2>

      <ul>
        <li>
          <a href="/privacy">Privacy Policy</a>
        </li>

        <li>
          <a href="/terms">Terms of Service</a>
        </li>

        <li>
          <a href="/aml">AML Policy</a>
        </li>

        <li>
          <a href="/kyc-policy">KYC Policy</a>
        </li>

        <li>
          <a href="/risk">Risk Disclosure</a>
        </li>

        <li>
          <a href="/cookies">Cookie Policy</a>
        </li>

        <li>
          <a href="/refund">Refund Policy</a>
        </li>

        <li>
          <a href="/compliance">Compliance Statement</a>
        </li>

        <li>
          <a href="/delete-account">Delete Account Information</a>
        </li>
      </ul>

      <p>
        These documents support Exalt Exchange users, Google Play requirements,
        compliance transparency, and future platform expansion.
      </p>

      <h2>Frequently Asked Questions</h2>

      {LEGAL_FAQS.map((item) => (
        <section key={item.question}>
          <h3>{item.question}</h3>
          <p>{item.answer}</p>
        </section>
      ))}
    </LegalLayout>
  );
}

export default LegalHome;