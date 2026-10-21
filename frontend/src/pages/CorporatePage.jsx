import React from "react";

const contactLinks = [
  { label: "Website", href: "https://www.yusuftan.com.tr", value: "yusuftan.com.tr" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/yusuftann/", value: "linkedin.com/in/yusuftann" },
  { label: "Email", href: "mailto:yusuftan41@hotmail.com", value: "yusuftan41@hotmail.com" },
];

export default function CorporatePage({ page, t, onNavigate }) {
  if (page === "corporate") {
    return (
      <div className="corporate-hub">
        {t.corporateGroups.map((group) => (
          <section className="corporate-group" key={group.title}>
            <div className="corporate-group-heading">
              <h2>{group.title}</h2>
              <p>{group.description}</p>
            </div>
            <div className="corporate-group-cards">
              {group.items.map((item) => (
                <button
                  className="corporate-link-card"
                  key={item.page}
                  onClick={() => onNavigate(item.page)}
                >
                  <span className="corporate-link-icon" aria-hidden="true">{item.icon}</span>
                  <span className="corporate-link-copy">
                    <strong>{item.title}</strong>
                    <span>{item.description}</span>
                  </span>
                  <span className="corporate-link-arrow" aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="corporate-page">
      <button className="corporate-back" onClick={() => onNavigate("corporate")}>
        ← {t.backToCorporate}
      </button>
      <section className="corporate-intro">
        <span className="corporate-mark" aria-hidden="true">
          {page === "about" ? "◎" : page === "contact" ? "✉" : page === "privacy" ? "◈" : "≡"}
        </span>
        <p>{t[`${page}Intro`]}</p>
      </section>

      {page === "about" && (
        <section className="corporate-cards">
          {t.aboutPrinciples.map((item) => (
            <article className="corporate-card" key={item.title}>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </article>
          ))}
        </section>
      )}

      {page === "contact" && (
        <section className="corporate-contact">
          <h2>{t.contactWaysTitle}</h2>
          <p>{t.contactWaysDescription}</p>
          <div className="contact-links">
            {contactLinks.map((link) => (
              <a
                href={link.href}
                key={link.label}
                target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                rel="noreferrer"
              >
                <span>{t[`contact${link.label}`]}</span>
                <strong>{link.value}</strong>
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {(page === "privacy" || page === "terms") && (
        <section className="corporate-sections">
          {t[`${page}Sections`].map((section) => (
            <article className="corporate-card" key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.text}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
