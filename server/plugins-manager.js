const fs = require("fs");
const { log } = require("../src/util");
const path = require("path");

class PluginsManager {

    /**
     * Plugin List
     * @type {Plugin[]}
     */
    pluginList = [];

    /**
     * Plugins Dir
     */
    pluginsDir;

    /**
     *
     * @param {UptimeKumaServer} server
     * @param {string} dir
     */
    constructor(server, dir) {
        this.pluginsDir = dir;

        if (! fs.existsSync(this.pluginsDir)) {
            fs.mkdirSync(this.pluginsDir, { recursive: true });
        }

        log.debug("plugin", "Scanning plugin directory");
        let list = fs.readdirSync(this.pluginsDir);

        this.pluginList = [];
        for (let item of list) {
            let plugin = new Plugin(server, this.pluginsDir + item);

            try {
                plugin.load();
                this.pluginList.push(plugin);
            } catch (e) {
                log.error("plugin", "Failed to load plugin: " + this.pluginsDir + item);
                log.error("plugin", "Reason: " + e.message);
            }
        }
    }

    /**
     * Install a Plugin
     * @param {string} tarGzFileURL The url of tar.gz file
     * @param {number} userID User ID - Used for streaming installing progress
     */
    installPlugin(tarGzFileURL, userID = undefined) {

    }

    /**
     * Remove a plugin
     * @param pluginID
     */
    removePlugin(pluginID) {

    }

    /**
     * Update a plugin
     * Only available for plugins which were downloaded from the official list
     * @param pluginID
     */
    updatePlugin(pluginID) {

    }
}

class Plugin {

    server = undefined;
    pluginDir = undefined;

    /**
     * Must be an `new-able` class.
     * @type {function}
     */
    pluginClass = undefined;

    /**
     *
     * @type {*}
     */
    object = undefined;
    info = {};

    /**
     *
     * @param {UptimeKumaServer} server
     * @param {string} pluginDir
     */
    constructor(server, pluginDir) {
        this.server = server;
        this.pluginDir = pluginDir;
    }

    load() {
        let indexFile = this.pluginDir + "/index.js";
        let packageJSON = this.pluginDir + "/package.json";

        if (fs.existsSync(indexFile)) {
            this.pluginClass = require(path.join(process.cwd(), indexFile));

            let pluginClassType = typeof this.pluginClass;

            if (pluginClassType === "function") {
                this.object = new this.pluginClass(this.server);
            } else {
                throw new Error("Invalid plugin, it does not export a class");
            }

            if (fs.existsSync(packageJSON)) {
                this.info = require(path.join(process.cwd(), packageJSON));
            } else {
                this.info.fullName = this.pluginDir;
                this.info.name = "[unknown]";
                this.info.version = "[unknown-version]";
            }

            log.info("plugin", `${this.info.fullName} v${this.info.version} loaded`);
        }
    }
}

module.exports = {
    PluginsManager,
    Plugin
};
