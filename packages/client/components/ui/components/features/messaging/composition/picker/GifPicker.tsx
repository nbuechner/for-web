import {
  Match,
  Suspense,
  Switch,
  createContext,
  createMemo,
  createSignal,
  useContext,
} from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { VirtualContainer } from "@minht11/solid-virtual-container";
import { useQuery } from "@tanstack/solid-query";
import { styled } from "styled-system/jsx";

import env from "@revolt/common/lib/env";
import {
  CircularProgress,
  TextField,
  typography,
} from "@revolt/ui/components/design";

import { CompositionMediaPickerContext } from "./CompositionMediaPicker";

type GifCategory = { title: string; image: string };

type GifResult = {
  url: string;
  previewUrl: string;
};

const KLIPY_BASE = `https://api.klipy.com/api/v1/${env.KLIPY_API_KEY}`;

function klipyFetch(path: string) {
  return fetch(`${KLIPY_BASE}${path}`).then((r) => r.json());
}

function mapGif(item: {
  file: { hd: { gif: { url: string } }; sm: { webm?: { url: string }; gif: { url: string } } };
}): GifResult {
  return {
    url: item.file.hd.gif.url,
    previewUrl: item.file.sm.webm?.url ?? item.file.sm.gif.url,
  };
}

const FilterContext = createContext<(value: string) => void>();

export function GifPicker() {
  const [filter, setFilter] = createSignal("");

  const filterLowercase = () => filter().toLowerCase();

  return (
    <Stack>
      <TextField
        autoFocus
        variant="filled"
        placeholder="Search for GIFs..."
        value={filter()}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }}
        onChange={(e) => setFilter(e.currentTarget.value)}
      />
      <Suspense fallback={<CircularProgress />}>
        <Switch
          fallback={
            <FilterContext.Provider value={setFilter}>
              <Categories />
            </FilterContext.Provider>
          }
        >
          <Match when={filterLowercase()}>
            <GifSearch query={filterLowercase()} />
          </Match>
        </Switch>
      </Suspense>
    </Stack>
  );
}

const Stack = styled("div", {
  base: {
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
  },
});

type CategoryItem =
  | { t: 0; category: GifCategory }
  | { t: 1; gif: GifResult | null };

function Categories() {
  let targetElement!: HTMLDivElement;

  const trendingCategories = useQuery<GifCategory[]>(() => ({
    queryKey: ["klipyCategories"],
    queryFn: () =>
      klipyFetch("/gifs/categories?locale=en_US").then((r) =>
        r.data.categories.map(
          (c: { category: string; preview_url: string }) => ({
            title: c.category,
            image: c.preview_url,
          }),
        ),
      ),
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  }));

  const trendingGif = useQuery<GifResult | null>(() => ({
    queryKey: ["klipyTrending1"],
    queryFn: () =>
      klipyFetch("/gifs/trending?locale=en_US&per_page=1").then(
        (r) => mapGif(r.data.data[0]) ?? null,
      ),
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    initialData: null,
  }));

  const items = createMemo(() => {
    return [
      { t: 1, gif: trendingGif.data },
      ...(trendingCategories.data?.map((category) => ({ t: 0, category })) ??
        []),
    ] as CategoryItem[];
  });

  return (
    <div ref={targetElement} use:invisibleScrollable>
      <VirtualContainer
        items={items()}
        scrollTarget={targetElement}
        itemSize={{ height: 120, width: 200 }}
        crossAxisCount={(measurements) =>
          Math.floor(measurements.container.cross / measurements.itemSize.cross)
        }
      >
        {CategoryItem}
      </VirtualContainer>
    </div>
  );
}

const CategoryItem = (props: {
  style: unknown;
  tabIndex: number;
  item: CategoryItem;
}) => {
  const setFilter = useContext(FilterContext);
  const image =
    props.item.t === 0 ? props.item.category.image : props.item.gif?.previewUrl;

  return (
    <Category
      style={{
        ...(props.style as object),
        "background-image": `linear-gradient(to right, #0006, #0006), url("${image}")`,
      }}
      tabIndex={props.tabIndex}
      role="listitem"
      onClick={() =>
        setFilter!(props.item.t === 0 ? props.item.category.title : "trending")
      }
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }}
    >
      <Switch fallback={<Trans>Trending GIFs</Trans>}>
        <Match when={props.item.t === 0}>
          {(props.item as CategoryItem & { t: 0 }).category.title}
        </Match>
      </Switch>
    </Category>
  );
};

const Category = styled("div", {
  base: {
    ...typography.raw({ class: "title", size: "small" }),

    width: "200px",
    height: "120px",
    backgroundSize: "cover",
    backgroundPosition: "center",

    color: "white",
    display: "flex",
    padding: "var(--gap-md)",

    alignItems: "end",
    justifyContent: "end",

    cursor: "pointer",
  },
});

function GifSearch(props: { query: string }) {
  let targetElement!: HTMLDivElement;

  const search = useQuery<GifResult[]>(() => ({
    queryKey: ["klipyGifs", props.query],
    queryFn: () => {
      const path =
        props.query === "trending"
          ? "/gifs/trending?locale=en_US&per_page=24"
          : `/gifs/search?locale=en_US&per_page=24&q=${encodeURIComponent(props.query)}`;
      return klipyFetch(path).then((r) => r.data.data.map(mapGif));
    },
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  }));

  return (
    <div ref={targetElement} use:invisibleScrollable>
      <VirtualContainer
        items={search.data as never}
        scrollTarget={targetElement}
        itemSize={{ height: 120, width: 200 }}
        crossAxisCount={(measurements) =>
          Math.floor(measurements.container.cross / measurements.itemSize.cross)
        }
      >
        {GifItem}
      </VirtualContainer>
    </div>
  );
}

const GifItem = (props: {
  style: unknown;
  tabIndex: number;
  item: GifResult;
}) => {
  const { onMessage } = useContext(CompositionMediaPickerContext);

  return (
    <Gif
      loop
      autoplay
      muted
      preload="auto"
      role="listitem"
      style={props.style as string}
      tabIndex={props.tabIndex}
      src={props.item.previewUrl}
      onClick={() => onMessage(props.item.url)}
    />
  );
};

const Gif = styled("video", {
  base: {
    width: "200px",
    height: "120px",
    cursor: "pointer",
    objectFit: "cover",
  },
});
