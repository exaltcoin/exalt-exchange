import { useEffect } from "react";

function FAQSchema({ questions = [] }) {
  useEffect(() => {
    if (!questions.length) {
      return;
    }

    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: questions.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    };

    const id = "exalt-faq-schema";

    let script = document.getElementById(id);

    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = id;
      document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(schema);

    return () => {
      const old = document.getElementById(id);

      if (old) {
        old.remove();
      }
    };
  }, [questions]);

  return null;
}

export default FAQSchema;