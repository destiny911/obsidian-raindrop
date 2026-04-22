import {
  App,
  Component,
  Plugin,
  PluginSettingTab,
  Setting,
  Modal,
  Notice,
  MarkdownView,
  type MarkdownPostProcessorContext,
} from "obsidian";
import { getCollections } from "src/raindrop";
import RaindropBlockQueryProvider from "src/components/RaindropBlockQueryProvider.svelte";

import type {
  BlockQueryMap,
  BlockQueryMapKeys,
} from "src/types";


export interface RaindropLiveSettings {
  raindropAccessToken: string;
  bookmarkListRefreshInterval: number;
}

const DEFAULT_SETTINGS: RaindropLiveSettings = {
  raindropAccessToken: "",
  bookmarkListRefreshInterval: 60,
};

export default class RaindropLive extends Plugin {
  settings: RaindropLiveSettings;

  async onload() {
    await this.loadSettings();
    this.registerPostProcessors();

    this.addRibbonIcon("links-coming-in", "Raindrop Live: Insert View", () => {
      new RaindropLiveModal(this.app, this).open();
    });

    this.addSettingTab(new RaindropLiveSettingsTab(this.app, this));
  }

  onunload() {
    // console.info("onunload");
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  /**
   * registerPostProcessors
   *
   * We use a code block preprocessor to parse the content for running queries to Raindrop
   * whenever the code block language is set to 'raindrop'
   */
  private registerPostProcessors() {
    // Raindrop code blocks.
    let registered = this.registerMarkdownCodeBlockProcessor(
      "raindrop",
      async (source: string, el, ctx) => {
        this.viewFromCodeBlock(source, el, ctx, ctx.sourcePath);
      }
    );
    registered.sortOrder = -100;
  }

  /**
   * Generate HTML elements and append them to the provided element based on
   * the results of a query to Raindrop using the provided parameters in a
   * codeblock with the 'raindrop' language defined.
   *
   * https://developer.raindrop.io/v1/raindrops/multiple#common-parameters
   * https://help.raindrop.io/using-search/#operators
   *
   * Collections special IDs:
   *
   * 	0 to get all (except Trash)
   * 	-1 to get from "Unsorted"
   * 	-99 to get from "Trash"
   *
   * @param {string} source Text content of the codeblock
   * @param {HTMLElement} el HTML element to which this code block is attached
   * @param {Component} component Obsidian component
   * @param {string} sourcePath
   */
  public async viewFromCodeBlock(
    source: string,
    el: HTMLElement,
    component: Component | MarkdownPostProcessorContext,
    sourcePath: string
  ) {
    // console.info('viewFromCodeBlock');

    const paramMap: BlockQueryMap = {
      highlights: false,
      raindropIDs: "",
      search: "",
      format: "",
      sort: "",
      showTags: true,
      collection: undefined,
    };

    Object.keys(paramMap).forEach((key: BlockQueryMapKeys) => {
      const re = new RegExp(`${key}:(.*)`);
      const matchArr = source.match(re);
      let result: string | number =
        matchArr && matchArr.length > 1 ? matchArr[1].trim() : null;
      
      if (key === 'collection') {
        paramMap['collection'] = (result === null) ? 0 : parseInt(result as string);
      } else if (key === 'showTags') {
        paramMap['showTags'] = (result !== 'false');
      } else if (key === 'highlights') {
        paramMap['highlights'] = (result === 'true');
      } else {
        paramMap[key] = result || (key === 'raindropIDs' ? "" : null);
      }
    });

    try {
      new RaindropBlockQueryProvider({
        target: el,
        props: {
          params: paramMap,
          settings: this.settings,
        },
      });
    } catch (err) {
      console.error(err);
    }
  }
}

class RaindropLiveModal extends Modal {
  plugin: RaindropLive;

  constructor(app: App, plugin: RaindropLive) {
    super(app);
    this.plugin = plugin;
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Raindrop Live: Builder" });

    if (!this.plugin.settings.raindropAccessToken) {
      contentEl.createEl("p", { text: "Please set your Raindrop Test Token in the plugin settings first." });
      return;
    }

    const collections = await getCollections(this.plugin.settings.raindropAccessToken);
    
    let selectedCollection = "0";
    let search = "";
    let sort = "-created";
    let showTags = true;
    let highlights = false;
    let format = "list";

    new Setting(contentEl)
      .setName("Collection")
      .addDropdown((dropdown) => {
        dropdown.addOption("0", "All Bookmarks");
        dropdown.addOption("-1", "Unsorted");
        collections.forEach((c: any) => {
          dropdown.addOption(c._id.toString(), c.title);
        });
        dropdown.onChange((value) => (selectedCollection = value));
      });

    new Setting(contentEl)
      .setName("Search Query")
      .setDesc("Optional: e.g. #tag or keyword")
      .addText((text) => text.onChange((value) => (search = value)));

    new Setting(contentEl)
      .setName("Sort Order")
      .addDropdown((dropdown) => {
        dropdown.addOption("-created", "Newest");
        dropdown.addOption("created", "Oldest");
        dropdown.addOption("-title", "Title (Z-A)");
        dropdown.addOption("title", "Title (A-Z)");
        dropdown.onChange((value) => (sort = value));
      });

    new Setting(contentEl)
      .setName("Display Highlights")
      .addToggle((toggle) => toggle.setValue(highlights).onChange((value) => (highlights = value)));

    new Setting(contentEl)
      .setName("Show Tags")
      .addToggle((toggle) => toggle.setValue(showTags).onChange((value) => (showTags = value)));

    new Setting(contentEl)
      .setName("Format")
      .addDropdown((dropdown) => {
        dropdown.addOption("list", "List");
        dropdown.addOption("table", "Table");
        dropdown.onChange((value) => (format = value));
      });

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Insert Raindrop View")
        .setCta()
        .onClick(() => {
          const codeblock = "```raindrop\n" +
            `collection: ${selectedCollection}\n` +
            (search ? `search: ${search}\n` : "") +
            `sort: ${sort}\n` +
            `showTags: ${showTags}\n` +
            `highlights: ${highlights}\n` +
            `format: ${format}\n` +
            "```";
          
          const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
          if (activeView && activeView.editor) {
            const cursor = activeView.editor.getCursor();
            activeView.editor.replaceRange(codeblock, cursor);
          } else {
            new Notice("No active markdown note found to insert into.");
          }
          this.close();
        })
    );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

/**
 *
 * We use the *test token* from an app the user sets up themselves.
 * The only way to securely use an app otherwise would be to establish
 * a server/service for oauth to hide secret and I'm not up for supporting that.
 *
 * https://developer.raindrop.io/v1/authentication/token
 */
class RaindropLiveSettingsTab extends PluginSettingTab {
  plugin: RaindropLive;

  constructor(app: App, plugin: RaindropLive) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h2", { text: "Raindrop Live Settings" });

    new Setting(containerEl)
      .setName("Raindrop Test Token")
      .setDesc("Get your token at https://app.raindrop.io/settings/integrations")
      .addText((text) =>
        text
          .setPlaceholder("Paste token here")
          .setValue(this.plugin.settings.raindropAccessToken)
          .onChange(async (value) => {
            this.plugin.settings.raindropAccessToken = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Auto Refresh (Minutes)")
      .setDesc("How often to refresh the live list.")
      .addText((text) =>
        text
          .setPlaceholder("60")
          .setValue(this.plugin.settings.bookmarkListRefreshInterval.toString())
          .onChange(async (value) => {
            const valueAsInt = parseInt(value);
            if (!isNaN(valueAsInt)) {
              this.plugin.settings.bookmarkListRefreshInterval = valueAsInt;
              await this.plugin.saveSettings();
            }
          })
      );
  }
}
