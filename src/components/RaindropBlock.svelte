<script lang="ts">
  import { IsFetching, useQuery } from "@sveltestack/svelte-query";
  import { getRaindrops, getRaindropsCollection } from "src/raindrop";
  import RaindropTag from "./RaindropTag.svelte";
  import WaitingIndicator from "./WaitingIndicator.svelte";

  import type { BlockQueryMap } from "../types";
  import type { RaindropLiveSettings } from "main";
  import { dataset_dev } from "svelte/internal";

  export let params: BlockQueryMap;
  export let settings: ObsidianRaindropSettings;

  const raindropsCacheKey = [`raindrops`, params];
  let raindrops: any;

  const refetchInterval = settings.bookmarkListRefreshInterval
    ? settings.bookmarkListRefreshInterval * 60000
    : 60000;

  raindrops = useQuery(
    raindropsCacheKey,
    async () => {
      console.log(params);
      return await getRaindrops(params, settings.raindropAccessToken);
    },
    {
      retry: false,
      refetchInterval,
      staleTime: Infinity,
      cacheTime: Infinity,
      notifyOnChangeProps: ["data", "error"],
    }
  );
</script>

<div id="bookmark-block-container" class="container">
  {#if $raindrops.status === "loading"}
    <div class="loading-wrapper">
      <WaitingIndicator />
    </div>
  {:else if $raindrops.status === "error"}
    <div class="error-wrapper">
      <span>Error: {$raindrops.error.message}</span>
    </div>
  {:else}
    {#if params.format === "table"}
      <table cellpadding="0" cellspacing="0" class="raindrop-table">
        {#each $raindrops.data as raindrop}
          <tr class="raindrop-row">
            <td class="raindrop-link-cell">
              <div class="raindrop-item-header">
                <img class="raindrop-favicon" src="https://www.google.com/s2/favicons?sz=32&domain={new URL(raindrop.link).hostname}" alt="" />
                <a href={raindrop.link} class="raindrop-title">
                  {raindrop.title}
                </a>
              </div>
            </td>
            {#if params.showTags === true}
              <td class="tag-cell">
                <div class="tags">
                  {#each raindrop.tags as tag, i}
                    <RaindropTag text={tag} />
                  {/each}
                </div>
              </td>
            {/if}
          </tr>
        {/each}
      </table>
    {:else}
      <ul class="raindrop-list">
        {#each $raindrops.data as raindrop}
          <li class="raindrop-list-item">
            <div class="raindrop-item-header">
              <img class="raindrop-favicon" src="https://www.google.com/s2/favicons?sz=32&domain={new URL(raindrop.link).hostname}" alt="" />
              <a href={raindrop.link} class="raindrop-title">
                {raindrop.title}
              </a>
              <span class="raindrop-domain">{new URL(raindrop.link).hostname.replace('www.', '')}</span>
            </div>
            {#if params.highlights === true && raindrop.highlights && raindrop.highlights.length > 0}
              <ul class="raindrop-highlight-list">
                {#each raindrop.highlights as highlight}
                  <li class="raindrop-highlight-list-item">
                    <figure class="raindrop-highlight-figure">
                      <blockquote class="raindrop-blockquote" cite={highlight.link}>
                        <p>{highlight.text}</p>
                      </blockquote>
                    </figure>
                    {#if highlight.note}
                      <p class="raindrop-highlight-note">{highlight.note}</p>
                    {/if}
                  </li>
                {/each}
              </ul>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
    {#if $raindrops.isFetching}
      <div class="fetching-indicator">
        <WaitingIndicator />
      </div>
    {/if}
  {/if}
</div>

<style lang="scss">
  #bookmark-block-container {
    padding: 10px 0;
  }

  .raindrop {
    &-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    &-list-item {
      padding: 8px 12px;
      margin: 4px 0;
      border-radius: 6px;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: var(--background-modifier-hover);
      }
    }

    &-item-header {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    &-favicon {
      width: 16px;
      height: 16px;
      border-radius: 3px;
      flex-shrink: 0;
    }

    &-title {
      font-weight: 500;
      color: var(--text-accent);
      text-decoration: none;
      font-size: 1.05em;

      &:hover {
        text-decoration: underline;
      }
    }

    &-domain {
      font-size: 0.85em;
      color: var(--text-muted);
      opacity: 0.7;
    }

    &-table {
      width: 100%;
      border-collapse: collapse;

      .raindrop-row {
        &:hover {
          background-color: var(--background-modifier-hover);
        }
      }

      td {
        padding: 8px 12px;
      }
    }

    &-highlight-list {
      margin: 12px 0 8px 28px;
      padding-left: 12px;
      border-left: 2px solid var(--interactive-accent);
      list-style: none;
    }

    &-highlight-list-item {
      margin-bottom: 12px;
    }

    &-blockquote {
      margin: 0;
      font-style: italic;
      color: var(--text-normal);
      opacity: 0.9;

      p {
        margin: 0;
      }
    }

    &-highlight-note {
      font-size: 0.9em;
      color: var(--text-muted);
      margin-top: 4px;
      padding-left: 0;
    }
  }

  .loading-wrapper, .fetching-indicator {
    display: flex;
    justify-content: center;
    padding: 20px;
  }

  .error-wrapper {
    color: var(--text-error);
    padding: 10px;
    border: 1px solid var(--text-error);
    border-radius: 4px;
  }
</style>
