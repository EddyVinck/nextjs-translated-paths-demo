import type {
  GetStaticPaths,
  GetStaticPathsResult,
  GetStaticProps,
  NextPage,
} from "next";
import Head from "next/head";
import Link from "next/link";
import { LanguageSwitch } from "../components/language-switch/language-switch";
import {
  AboutPage,
  CategoryOverviewPage,
  CategoryPage,
  HomePage,
  ProductPage,
  SubCategoryPage,
} from "../components/templates";

type PageType =
  | "homePage"
  | "aboutPage"
  | "categoryOverviewPage"
  | "categoryPage"
  | "subCategoryPage"
  | "productPage";

const pageMap: Record<PageType, () => JSX.Element> = {
  homePage: HomePage,
  aboutPage: AboutPage,
  categoryPage: CategoryPage,
  subCategoryPage: SubCategoryPage,
  productPage: ProductPage,
  categoryOverviewPage: CategoryOverviewPage,
};

function idToSlugPieces(id: string): string[] {
  return id.split("_");
}

function slugPiecesToId(slugPieces: string[], locale: string) {
  if (!slugPieces?.length) {
    if (locale === "nl") {
      return "thuis";
    } else if (locale === "en") {
      return "home";
    } else {
      throw new Error(
        `Something went wrong trying to get an id for locale of "${locale}" and these slugPieces: ${JSON.stringify(
          slugPieces
        )}`
      );
    }
  }
  return slugPieces.join("_");
}

function slugPiecesToPath(slugPieces: string[]): string {
  return slugPieces.join("/");
}

function slugResolver(slugPieces: string[], pageType: PageType) {
  let newSlugPieces = slugPieces;
  if (pageType === "homePage") {
    newSlugPieces = []; // homepage
  }
  return newSlugPieces;
}

function normalizePathParams(paths: Page[]): GetStaticPathsResult["paths"] {
  // format the data so it can be returned by getStaticPaths
  return paths.map((path) => {
    const {
      id,
      data: { pageType, locale },
    } = path;

    const slugPieces = idToSlugPieces(id);
    let slug = slugResolver(slugPieces, pageType);

    // You can only pass `slug` here because the file is called `[[...slug]].tsx`.
    // Unfortunately it's not possible to pass any other data, you have to fetch it again in `getStaticProps`
    return { params: { slug }, locale };
  });
}

// This is an Optional Catch-All Route
// See: https://nextjs.org/docs/routing/dynamic-routes#optional-catch-all-routes
// example from https://github.com/vercel/next.js/discussions/18485#discussioncomment-2955023
export const getStaticPaths: GetStaticPaths = async ({ locales }) => {
  if (!locales) {
    throw new Error("Couldn't find locales.");
  }

  const pathsReq = await fetch("http://localhost:5001/paths");
  const pathsData: Page[] = await pathsReq.json();
  const paths = normalizePathParams(pathsData);

  return {
    paths: paths,
    fallback: false,
  };
};

type Page = {
  id: string;
  data: {
    title: string;
    locale: string;
    pageType: PageType;
    translations: Array<{ id: string; locale: string }>;
  };
};

export const getStaticProps: GetStaticProps = async (context) => {
  const { locale } = context;

  const id = slugPiecesToId(context.params?.slug as string[], locale as string);
  const pageIdEndpoint = `http://localhost:5001/paths/${id}`;
  const pageReq = await fetch(pageIdEndpoint);
  const page: Page = await pageReq.json();

  const pageTranslations = page.data.translations.map(({ id, locale }) => {
    const slugPieces = idToSlugPieces(id);
    const resolvedSlugPieces = slugResolver(slugPieces, page.data.pageType);
    const path = slugPiecesToPath(resolvedSlugPieces);
    return {
      href: `http://localhost:3000/${path}`,
      locale,
    };
  });

  const allPagesReq = await fetch("http://localhost:5001/paths");
  const allPages: Page[] = await allPagesReq.json();
  const navigation = allPages.map(
    ({ id, data: { title, pageType, locale } }) => {
      const slugPieces = idToSlugPieces(id);
      const resolvedSlugPieces = slugResolver(slugPieces, pageType);
      const path = slugPiecesToPath(resolvedSlugPieces);
      return {
        text: title,
        href: `http://localhost:3000/${path}`,
        locale: locale,
      };
    }
  );

  return {
    props: { page, locale, translations: pageTranslations, navigation },
  };
};

const MyDyanmicPage: NextPage<{
  page: {
    data: {
      title: string;
      locale: string;
      pageType: PageType;
      translations: Array<{ id: string; locale: string }>;
    };
  };
  locale: string;
  translations: Array<{ href: string; locale: string }>;
  navigation: {
    text: string;
    href: string;
    locale: string;
  }[];
}> = ({ page, locale, translations, navigation }) => {
  const pageType = page.data.pageType;
  const Page = pageMap[pageType];

  return (
    <div>
      <Head>
        <title>{page.data.title}</title>
      </Head>
      <header>
        <h1>{page.data.title}</h1>
        <LanguageSwitch translations={translations} />
        <p>Go to a different page:</p>
        <nav>
          <ul>
            {navigation
              ?.filter((link) => link.locale === locale)
              .map(({ href, text, locale }) => (
                <li key={href}>
                  <Link href={href} passHref locale={locale}>
                    <a>{text}</a>
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
      </header>
      <Page />
    </div>
  );
};

export default MyDyanmicPage;
