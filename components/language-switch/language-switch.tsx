import Link from "next/link";

export const LanguageSwitch = ({
  translations,
}: {
  translations: Array<{ href: string; locale: string }>;
}) => {
  if (!translations?.length) return null;
  return (
    <nav>
      <p>View in different language:</p>
      <ul>
        {translations.map((translation) => (
          <li key={translation.href}>
            <Link href={translation.href} passHref>
              <a hrefLang={translation.locale}>
                {translation.locale.toUpperCase()}
              </a>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};
