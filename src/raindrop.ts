import type { BlockQueryMap } from "./types";

const RAINDROP_API_BASE = "https://api.raindrop.io/rest/v1/";

const getCollections = async (accessToken: string) => {
  const result = await fetch(`${RAINDROP_API_BASE}collections`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await result.json();
  return data.items || [];
};

const getRaindropsCollection = async (
  collectionID: number = 0,
  search: string,
  sort: string,
  accessToken: string
) => {
  // console.info('getRaindropsCollection');
  let params: Record<string, any> = {};
  let url = new URL(`${RAINDROP_API_BASE}raindrops/${collectionID}`);

  if (search) params = { search, ...params };
  if (sort) params = { sort, ...params };

  url.search = new URLSearchParams(params).toString();

  const result = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const raindrops = await result.json();
  console.log("getRaindropsCollection result", raindrops);
  return raindrops.items;
};

const getRaindrop = async (raindropID: number = 0, accessToken: string) => {
  console.info("getRaindrop", raindropID);
  let params: Record<string, any> = {};
  let url = new URL(`${RAINDROP_API_BASE}raindrop/${raindropID}`);

  const result = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const raindrop = await result.json();
  console.log("getRaindrop result", raindrop);
  return raindrop;
};

const getRaindrops = async (params: BlockQueryMap, accessToken: string) => {
  console.info("getRaindrops", params);
  let raindrops: any[] = [];

  try {
    if (params.collection !== null && params.collection !== undefined) {
      raindrops = await getRaindropsCollection(
        params["collection"],
        params["search"],
        params["sort"],
        accessToken
      );
      return raindrops || [];
    }

    if (params.raindropIDs) {
      const raindropIDArr = params.raindropIDs.toString().split(",");
      for (const raindropID of raindropIDArr) {
        const result = await getRaindrop(parseInt(raindropID.trim()), accessToken);
        if (result && result.item) {
          raindrops.push(result.item);
        }
      }
    }
  } catch (error) {
    console.error("Error fetching raindrops:", error);
    throw new Error("Failed to fetch bookmarks from Raindrop. Check your token or connection.");
  }

  return raindrops;
};

export { getRaindropsCollection, getRaindrops, getCollections };
