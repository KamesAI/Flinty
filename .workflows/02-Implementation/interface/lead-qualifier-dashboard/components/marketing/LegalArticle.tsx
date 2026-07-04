interface LegalSection {
  title: string;
  paragraphs: string[];
}

interface LegalArticleProps {
  title: string;
  updatedAt: string;
  sections: LegalSection[];
}

export function LegalArticle({ title, updatedAt, sections }: LegalArticleProps) {
  return (
    <article className="container max-w-3xl py-16 md:py-24">
      <h1 className="font-flinty text-3xl text-foreground md:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Dernière mise à jour : {updatedAt}</p>
      <div className="mt-10 space-y-10">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-3 text-xl font-semibold text-foreground">{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mb-3 text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
