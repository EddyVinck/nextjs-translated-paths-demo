import { useRouter } from "next/router";

export const Layout = ({ pageType }: { pageType: string }) => {
  const router = useRouter();

  return (
    <div>
      <h2>Pagetype: {pageType}</h2>
      <p>asPath: {router.asPath}</p>
      <p>pathname: {router.pathname}</p>
      <p>query:</p>
      <pre>
        {Object.entries(router.query)
          .map(([key, value]) => {
            return [key, value];
          })
          .join("\n")}
      </pre>
    </div>
  );
};
