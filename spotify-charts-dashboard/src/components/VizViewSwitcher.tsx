import type { NextRouter } from "next/router";
import { useRouter } from "next/router";
import BasicSelect from "./filtering-and-selecting/BasicSelect";
import classNames from "classnames";

const VizViewSwitcher = ({ className }: { className?: string }) => {
  const subpageData = useViewSubpageData();
  const router = useRouter();

  return (
    <div className={classNames("min-w-[200px]", className)}>
      <BasicSelect
        label={"Current Data View"}
        onChange={(newHref: string) => {
          console.log(newHref);
          void router.push(newHref);
        }}
        value={subpageData.find((o) => o.isCurrent)?.href}
        options={subpageData.map((o) => ({
          value: o.href,
          label: o.title,
        }))}
      />
    </div>
  );
};
export default VizViewSwitcher;

function useViewSubpageData() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const currentSubPagePathData = getSubpaths(router).at(-1)!;

  const subpageNamesCamelCase = ["compare-tracks", "explore-relationships"];
  const subpageNamesTitleCase = subpageNamesCamelCase.map((str) =>
    toTitleCase(str.replace(/-/g, " "))
  );
  const subpageData = subpageNamesCamelCase.map((name, idx) => ({
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    title: subpageNamesTitleCase[idx]!,
    href: `/viz/${name}`,
    isCurrent: currentSubPagePathData.subpath === name,
  }));

  return subpageData;
}

// copied/adapted from https://dev.to/dan_starner/building-dynamic-breadcrumbs-in-nextjs-17oa
function getSubpaths(router: NextRouter) {
  // Remove any query parameters, as those aren't included in breadcrumbs
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const asPathWithoutQuery = router.asPath.split("?")[0]!;

  // Break down the path between "/"s, removing empty entities
  // Ex:"/my/nested/path" --> ["my", "nested", "path"]
  const asPathNestedRoutes = asPathWithoutQuery
    .split("/")
    .filter((v) => v.length > 0);

  const subpaths = asPathNestedRoutes
    .map((subpath, idx) => {
      // We can get the partial nested route
      // by joining together the path parts up to this point.
      const href = "/" + asPathNestedRoutes.slice(0, idx + 1).join("/");
      return { href, subpath };
    })
    .slice(1, asPathNestedRoutes.length);

  return subpaths;
}

function toTitleCase(str: string) {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}
