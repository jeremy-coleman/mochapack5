import path, { posix, win32, join } from 'path';
import _ from 'lodash';
import yargs from 'yargs';
import fs from 'fs';
import interpret from 'interpret';
import globby from 'globby';
import isGlob from 'is-glob';
import globParent from 'glob-parent';
import normalizePath from 'normalize-path';
import { EventEmitter } from 'events';
import chokidar from 'chokidar';
import minimatch from 'minimatch';
import webpack, { ProgressPlugin } from 'webpack';
import Watching from 'webpack/lib/Watching';
import sourceMapSupport from 'source-map-support';
import MemoryFileSystem from 'memory-fs';
import Module from 'module';
import Mocha, { reporters, interfaces } from 'mocha';
import toposort from 'toposort';
import chalk from 'chalk';
import ProgressBar from 'progress';
import { EOL } from 'os';
import RequestShortener from 'webpack/lib/RequestShortener';

// lodash, yargs, interpret, globby, is-glob, glob-parent, normalize-path, chokidar, minimatch, source-map-support, memory-fs, mocha, toposort, chalk, progress

//webpack is fucking disgusting
const entryPath = path.resolve(__dirname, './entry.js');
const entryLoaderPath = path.resolve(__dirname, './entryLoader.js');
const includeLoaderPath = path.resolve(__dirname, './includeFilesLoader.js');


const BASIC_GROUP = 'Basic options:';
const OUTPUT_GROUP = 'Output options:';
const ADVANCED_GROUP = 'Advanced options:';

const options = {
    'async-only': {
        alias: 'A',
        type: 'boolean',
        default: false,
        describe: 'force all tests to take a callback (async) or return a promise',
        group: ADVANCED_GROUP
    },
    colors: {
        alias: 'c',
        type: 'boolean',
        default: undefined,
        describe: 'force enabling of colors',
        group: OUTPUT_GROUP
    },
    quiet: {
        alias: 'q',
        type: 'boolean',
        default: undefined,
        describe: 'does not show informational messages',
        group: OUTPUT_GROUP
    },
    interactive: {
        type: 'boolean',
        default: !!process.stdout.isTTY,
        describe: 'force interactive mode (default enabled in terminal)',
        group: OUTPUT_GROUP
    },
    'clear-terminal': {
        type: 'boolean',
        default: false,
        describe: 'clear current terminal, purging its histroy',
        group: OUTPUT_GROUP
    },
    growl: {
        alias: 'G',
        type: 'boolean',
        default: false,
        describe: 'enable growl notification support',
        group: OUTPUT_GROUP
    },
    recursive: {
        type: 'boolean',
        default: false,
        describe: 'include sub directories',
        group: ADVANCED_GROUP
    },
    reporter: {
        alias: 'R',
        type: 'string',
        describe: 'specify the reporter to use',
        group: OUTPUT_GROUP,
        default: 'spec',
        requiresArg: true
    },
    'reporter-options': {
        alias: 'O',
        type: 'string',
        describe: 'reporter-specific options, --reporter-options <k=v,k2=v2,...>',
        group: OUTPUT_GROUP,
        requiresArg: true
    },
    bail: {
        alias: 'b',
        type: 'boolean',
        describe: 'bail after first test failure',
        group: ADVANCED_GROUP,
        default: false
    },
    glob: {
        type: 'string',
        describe: 'only test files matching <pattern> (only valid for directory entry)',
        group: ADVANCED_GROUP,
        requiresArg: true
    },
    grep: {
        alias: 'g',
        type: 'string',
        describe: 'only run tests matching <pattern>',
        group: ADVANCED_GROUP,
        requiresArg: true
    },
    fgrep: {
        alias: 'f',
        type: 'string',
        describe: 'only run tests containing <string>',
        group: ADVANCED_GROUP,
        requiresArg: true
    },
    invert: {
        alias: 'i',
        type: 'boolean',
        describe: 'inverts --grep and --fgrep matches',
        group: ADVANCED_GROUP,
        default: false
    },
    require: {
        alias: 'r',
        type: 'string',
        describe: 'require the given module',
        group: ADVANCED_GROUP,
        requiresArg: true,
        multiple: true
    },
    include: {
        type: 'string',
        describe: 'include the given module into test bundle',
        group: ADVANCED_GROUP,
        requiresArg: true,
        multiple: true
    },
    slow: {
        alias: 's',
        describe: '"slow" test threshold in milliseconds',
        group: ADVANCED_GROUP,
        default: 75,
        defaultDescription: '75 ms',
        requiresArg: true
    },
    timeout: {
        alias: 't',
        describe: 'set test-case timeout in milliseconds',
        group: ADVANCED_GROUP,
        default: 2000,
        defaultDescription: '2000 ms',
        requiresArg: true
    },
    ui: {
        alias: 'u',
        describe: 'specify user-interface (e.g. "bdd", "tdd", "exports", "qunit")',
        group: BASIC_GROUP,
        default: 'bdd',
        requiresArg: true
    },
    watch: {
        alias: 'w',
        type: 'boolean',
        describe: 'watch files for changes',
        group: BASIC_GROUP,
        default: false
    },
    'check-leaks': {
        type: 'boolean',
        describe: 'check for global variable leaks',
        group: ADVANCED_GROUP,
        default: false
    },
    'full-trace': {
        type: 'boolean',
        describe: 'display the full stack trace',
        group: ADVANCED_GROUP,
        default: false
    },
    'inline-diffs': {
        type: 'boolean',
        describe: 'display actual/expected differences inline within each string',
        group: ADVANCED_GROUP,
        default: false
    },
    exit: {
        type: 'boolean',
        describe: 'require a clean shutdown of the event loop: mocha will not call process.exit',
        group: ADVANCED_GROUP,
        default: false
    },
    retries: {
        describe: 'set numbers of time to retry a failed test case',
        group: BASIC_GROUP,
        requiresArg: true
    },
    delay: {
        type: 'boolean',
        describe: 'wait for async suite definition',
        group: ADVANCED_GROUP,
        default: false
    },
    mode: {
        type: 'string',
        choices: ['development', 'production'],
        describe: 'webpack mode to use',
        group: BASIC_GROUP,
        requiresArg: true
    },
    'webpack-config': {
        type: 'string',
        describe: 'path to webpack-config file',
        group: BASIC_GROUP,
        requiresArg: true,
        default: 'webpack.config.js'
    },
    'webpack-env': {
        describe: 'environment passed to the webpack-config, when it is a function',
        group: BASIC_GROUP
    },
    opts: {
        type: 'string',
        describe: 'path to webpack-mocha options file',
        group: BASIC_GROUP,
        requiresArg: true
    },
    'forbid-only': {
        type: 'boolean',
        describe: 'fail if exclusive test(s) encountered',
        group: ADVANCED_GROUP,
        default: false
    }
};

const paramList = opts => _.map(_.keys(opts), _.camelCase);
const parameters = paramList(options);
const parametersWithMultipleArgs = paramList(_.pickBy(_.mapValues(options, v => !!v.requiresArg && v.multiple === true)));
const groupedAliases = _.values(_.mapValues(options, (value, key) => [_.camelCase(key), key, value.alias].filter(_.identity)));

function parse(argv, ignoreDefaults) {
    const parsedArgs = yargs
        .help('help')
        .alias('help', 'h')
        .version()
        //@ts-ignore
        .options(options)
        .strict()
        .parse(argv);
    let files = parsedArgs._;
    if (!files.length) {
        files = ['./test'];
    }
    const parsedOptions = _.pick(parsedArgs, parameters);
    const validOptions = _.omitBy(parsedOptions, _.isUndefined);
    _.forEach(parametersWithMultipleArgs, key => {
        if (_.has(validOptions, key)) {
            const value = validOptions[key];
            if (!Array.isArray(value)) {
                validOptions[key] = [value];
            }
        }
    });
    _.forOwn(validOptions, (value, key) => {
        if (parametersWithMultipleArgs.indexOf(key) === -1 && _.isArray(value)) {
            const arg = _.kebabCase(key);
            const provided = value.map(v => `--${arg} ${v}`).join(' ');
            const expected = `--${arg} ${value[0]}`;
            throw new Error(`Duplicating arguments for "--${arg}" is not allowed. "${provided}" was provided, but expected "${expected}"`);
        }
    });
    validOptions.files = files;
    const reporterOptions = {};
    if (validOptions.reporterOptions) {
        validOptions.reporterOptions.split(',').forEach(opt => {
            const L = opt.split('=');
            if (L.length > 2 || L.length === 0) {
                throw new Error(`invalid reporter option ${opt}`);
            }
            else if (L.length === 2) {
                reporterOptions[L[0]] = L[1];
            }
            else {
                reporterOptions[L[0]] = true;
            }
        });
    }
    validOptions.reporterOptions = reporterOptions;
    validOptions.require = validOptions.require || [];
    validOptions.include = validOptions.include || [];
    if (validOptions.webpackEnv) {
        _.mapValues(validOptions.webpackEnv, (value, key) => {
            if (Array.isArray(value)) {
                const [first] = value;
                validOptions.webpackEnv[key] = first;
            }
        });
    }
    if (ignoreDefaults) {
        const userOptions = yargs(argv).argv;
        const providedKeys = _.keys(userOptions);
        const usedAliases = _.flatten(_.filter(groupedAliases, aliases => _.some(aliases, alias => providedKeys.indexOf(alias) !== -1)));
        if (parsedArgs._.length) {
            usedAliases.push('files');
        }
        return _.pick(validOptions, usedAliases);
    }
    return validOptions;
}

function parseArgv(argv, ignoreDefaults = false) {
    const origMainFilename = require.main.filename;
    try {
        require.main.filename = require.resolve('../bin/_mocha');
        return parse(argv, ignoreDefaults);
    }
    finally {
        require.main.filename = origMainFilename;
    }
}

function existsFileSync(file) {
    try {
        fs.accessSync(file, fs.constants.F_OK);
        return true;
    }
    catch (e) {
        return false;
    }
}

const defaultConfig = 'mochapack.opts';

function handleMissingConfig(config) {
    if (config) {
        throw new Error(`Options file '${config}' not found`);
    }
    return {};
}
const createStripSurroundingChar = c => s => {
    if (s.indexOf(c) === 0 &&
        s.lastIndexOf(c) === s.length - 1 &&
        s.indexOf(c) !== s.lastIndexOf(c)) {
        return s.substring(1, s.length - 1);
    }
    return s;
};
const stripSingleQuotes = createStripSurroundingChar("'");
const stripDoubleQuotes = createStripSurroundingChar('"');
const removeSurroundingQuotes = str => {
    const stripped = stripDoubleQuotes(str);
    if (stripped !== str) {
        return stripped;
    }
    return stripSingleQuotes(str);
};
function parseConfig(explicitConfig) {
    const config = explicitConfig || defaultConfig;
    if (!existsFileSync(config)) {
        return handleMissingConfig(explicitConfig);
    }
    const argv = fs
        .readFileSync(config, 'utf8')
        .replace(/\\\s/g, '%20')
        .split(/\s/)
        .filter(Boolean)
        .map(value => value.replace(/%20/g, ' '))
        .map(removeSurroundingQuotes);
    const defaultOptions = parseArgv(argv, true);
    return defaultOptions;
}

function sortExtensions(ext1, ext2) {
    if (ext1 === '.js') {
        return -1;
    }
    if (ext2 === '.js') {
        return 1;
    }
    return ext1.length - ext2.length;
}
const extensions = Object.keys(interpret.extensions).sort(sortExtensions);
function fileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    }
    catch (e) {
        return false;
    }
}
function findConfigFile(dirPath, baseName) {
    for (let i = 0; i < extensions.length; i += 1) {
        const filePath = path.resolve(dirPath, `${baseName}${extensions[i]}`);
        if (fileExists(filePath)) {
            return filePath;
        }
    }
    return null;
}
function getConfigExtension(configPath) {
    for (let i = extensions.length - 1; i >= 0; i -= 1) {
        const extension = extensions[i];
        if (configPath.indexOf(extension, configPath.length - extension.length) > -1) {
            return extension;
        }
    }
    return path.extname(configPath);
}
function registerCompiler(moduleDescriptor) {
    if (!moduleDescriptor) {
        return;
    }
    if (typeof moduleDescriptor === 'string') {
        require(moduleDescriptor);
    }
    else if (!Array.isArray(moduleDescriptor)) {
        const module = require(moduleDescriptor.module);
        moduleDescriptor.register(module);
    }
    else {
        for (let i = 0; i < moduleDescriptor.length; i += 1) {
            try {
                registerCompiler(moduleDescriptor[i]);
                break;
            }
            catch (e) {
            }
        }
    }
}
async function requireWebpackConfig(webpackConfig, required, env, mode) {
    const configPath = path.resolve(webpackConfig);
    const configExtension = getConfigExtension(configPath);
    let configFound = false;
    let config = {};
    if (fileExists(configPath)) {
        registerCompiler(interpret.extensions[configExtension]);
        config = require(configPath);
        configFound = true;
    }
    else if (configExtension === '.js') {
        const configDirPath = path.dirname(configPath);
        const configBaseName = path.basename(configPath, configExtension);
        const configPathPrecompiled = findConfigFile(configDirPath, configBaseName);
        if (configPathPrecompiled != null) {
            const configExtensionPrecompiled = getConfigExtension(configPathPrecompiled);
            registerCompiler(interpret.extensions[configExtensionPrecompiled]);
            config = require(configPathPrecompiled);
            configFound = true;
        }
    }
    if (!configFound) {
        if (required) {
            throw new Error(`Webpack config could not be found: ${webpackConfig}`);
        }
        else if (mode != null) {
            config.mode = mode;
        }
        return config;
    }
    config = config.default || config;
    if (typeof config === 'function') {
        //@ts-ignore
        config = await Promise.resolve(config(env));
    }
    if (mode != null) {
        config.mode = mode;
    }
    if (Array.isArray(config)) {
        throw new Error('Passing multiple configs as an Array is not supported. Please provide a single config instead.');
    }
    return config;
}

const isDirectory = filePath => path.extname(filePath).length === 0;
const glob = async (patterns, options) => globby(patterns, options);
const ensureGlob = (entry, recursive = false, pattern = '*.js') => {
    const normalized = normalizePath(entry);
    if (isGlob(normalized)) {
        return normalized;
    }
    else if (isDirectory(normalized)) {
        if (!isGlob(pattern)) {
            throw new Error(`Provided Glob ${pattern} is not a valid glob pattern`);
        }
        const parent = globParent(pattern);
        if (parent !== '.' || pattern.indexOf('**') !== -1) {
            throw new Error(`Provided Glob ${pattern} must be a file pattern like *.js`);
        }
        const globstar = recursive ? '**/' : '';
        return `${normalized}/${globstar}${pattern}`;
    }
    return normalized;
};
const extensionsToGlob = (extensions) => {
    const filtered = extensions.filter(Boolean);
    if (filtered.length === 0) {
        return '*.js';
    }
    else if (filtered.length === 1) {
        return `*${filtered[0]}`;
    }
    return `*{${filtered.join(',')}}`;
};

function createCompiler(webpackConfig) {
    const compiler = webpack(webpackConfig);
    return compiler;
}

const noop = () => undefined;
function createWatchCompiler(compiler, watchOptions) {
    const createWatcher = () => new Watching(compiler, watchOptions, noop);
    let watchCompiler = null;
    return {
        watch() {
            if (watchCompiler === null) {
                watchCompiler = createWatcher();
            }
            else {
                const times = compiler.watchFileSystem.watcher.getTimes();
                if (Object.keys(times).length > 0) {
                    const timesMap = new Map(Object.keys(times).map(key => [key, times[key]]));
                    compiler.fileTimestamps = timesMap;
                    compiler.contextTimestamps = timesMap;
                }
                watchCompiler.close(() => {
                    watchCompiler = createWatcher();
                });
            }
        },
        pause() {
            if (watchCompiler !== null && watchCompiler.watcher) {
                watchCompiler.watcher.pause();
            }
        },
        getWatchOptions() {
            return _.get(watchCompiler, 'watchOptions', { aggregateTimeout: 200 });
        }
    };
}

let requireCaller;
let pathResolvers = [];
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function _resolveFilename(...parameters) {
    const parent = parameters[1];
    requireCaller = parent;
    return originalResolveFilename.apply(this, parameters);
};
const originalFindPath = Module._findPath;
Module._findPath = function _findPath(...parameters) {
    const request = parameters[0];
    for (const resolve of pathResolvers) {
        const resolved = resolve(request, requireCaller);
        if (typeof resolved !== 'undefined') {
            return resolved;
        }
    }
    const filename = originalFindPath.apply(this, parameters);
    if (filename !== false) {
        return filename;
    }
    return false;
};
function registerRequireHook(dotExt, resolve) {
    const sourceCache = {};
    const affectedFiles = {};
    const resolvePath = (path, parent) => {
        const { path: resolvedPath, source } = resolve(path, parent);
        if (resolvedPath == null) {
            return undefined;
        }
        delete require.cache[resolvedPath];
        sourceCache[resolvedPath] = source;
        return resolvedPath;
    };
    const resolveSource = path => {
        const source = sourceCache[path];
        delete sourceCache[path];
        return source;
    };
    pathResolvers.push(resolvePath);
    //@ts-ignore
    const originalLoader = Module._extensions[dotExt];
    //@ts-ignore
    Module._extensions[dotExt] = (module, filename) => {
        const source = resolveSource(filename);
        if (typeof source === 'undefined') {
            //@ts-ignore
            (originalLoader || Module._extensions['.js'])(module, filename);
            return;
        }
        affectedFiles[filename] = true;
        module._compile(source, filename);
    };
    return function unmount() {
        pathResolvers = pathResolvers.filter(r => r !== resolvePath);
        //@ts-ignore
        Module._extensions[dotExt] = originalLoader;
        Object.keys(affectedFiles).forEach(path => {
            delete require.cache[path];
            delete sourceCache[path];
            delete affectedFiles[path];
        });
    };
}

function ensureAbsolutePath(path, basePath) {
    return posix.isAbsolute(path) || win32.isAbsolute(path)
        ? path
        : join(basePath, path);
}

function registerInMemoryCompiler(compiler) {
    const memoryFs = new MemoryFileSystem();
    compiler.outputFileSystem = memoryFs;
    const assetMap = new Map();

    compiler.hooks.done.tap('mochapack', (stats) => {
        assetMap.clear();
        if (!stats.hasErrors()) {
            Object.keys(stats.compilation.assets).forEach(assetPath => assetMap.set(ensureAbsolutePath(assetPath, compiler.options.output.path), true));
        }
    });
    
    let readFile = filePath => {
        if (assetMap.has(filePath)) {
            try {
                const code = memoryFs.readFileSync(filePath, 'utf8');
                return code;
            }
            catch (e) {
                return null;
            }
        }
        return null;
    };
    const resolveFile = (filePath, requireCaller) => {
        let code = readFile(filePath);
        let resolvedPath = filePath;
        if (code === null && requireCaller != null) {
            const { filename } = requireCaller;
            if (filename != null) {
                resolvedPath = path.resolve(path.dirname(filename), filePath);
                code = readFile(resolvedPath);
            }
        }
        return { path: code !== null ? resolvedPath : null, source: code };
    };
    const unmountHook = registerRequireHook('.js', resolveFile);
    sourceMapSupport.install({
        emptyCacheBetweenOperations: true,
        handleUncaughtExceptions: false,
        environment: 'node',
        retrieveFile: f => readFile(f)
    });
    return function unmount() {
        unmountHook();
        readFile = filePath => null;
    };
}

function registerReadyCallback(compiler, cb) {
    compiler.hooks.failed.tap('mochapack', cb);
    compiler.hooks.done.tap('mochapack', (stats) => {
        if (stats.hasErrors()) {
            const jsonStats = stats.toJson();
            const [err] = jsonStats.errors;
            cb(err, stats);
        }
        else {
            cb(null, stats);
        }
    });
}

class EntryConfig {
    constructor() {
        this.files = [];
    }
    addFile(file) {
        const normalizedFile = normalizePath(file);
        this.files.push(normalizedFile);
    }
    removeFile(file) {
        const normalizedFile = normalizePath(file);
        this.files = this.files.filter(f => f !== normalizedFile);
    }
    getFiles() {
        return this.files;
    }
}

function loadReporter(reporter, cwd) {
    if (typeof reporter === 'function') {
        return reporter;
    }
    if (typeof reporters[reporter] !== 'undefined') {
        return reporters[reporter];
    }
    let loadedReporter = null;
    try {
        loadedReporter = require(reporter);
    }
    catch (e) {
        loadedReporter = require(path.resolve(cwd, reporter));
    }
    return loadedReporter;
}

function loadUI(ui, cwd) {
    if (typeof interfaces[ui] !== 'undefined') {
        return ui;
    }
    let loadedUI = null;
    try {
        loadedUI = require.resolve(ui);
    }
    catch (e) {
        loadedUI = require.resolve(path.resolve(cwd, ui));
    }
    return loadedUI;
}

function configureMocha(options) {
    Error.stackTraceLimit = Infinity;
    const mocha = new Mocha();
    const reporter = loadReporter(options.reporter, options.cwd);
    mocha.reporter(reporter, options.reporterOptions);
    //@ts-ignore
    mocha.color(options.colors);
    //@ts-ignore
    mocha.inlineDiffs(options.inlineDiffs);
    mocha.suite.slow(options.slow);
    if (options.timeout === 0) {
        mocha.enableTimeouts(false);
    }
    else {
        mocha.suite.timeout(options.timeout);
    }
    mocha.suite.bail(options.bail);
    if (options.grep) {
        mocha.grep(new RegExp(options.grep));
    }
    if (options.fgrep) {
        mocha.grep(options.fgrep);
    }
    if (options.invert) {
        mocha.invert();
    }
    if (options.ignoreLeaks === false) {
        mocha.checkLeaks();
    }
    if (options.fullStackTrace) {
        mocha.fullTrace();
    }
    if (options.growl) {
        mocha.growl();
    }
    if (options.asyncOnly) {
        mocha.asyncOnly();
    }
    if (options.delay) {
        mocha.delay();
    }
    if (options.retries) {
        mocha.suite.retries(options.retries);
    }
    if (options.forbidOnly) {
        mocha.forbidOnly();
    }
    const ui = loadUI(options.ui, options.cwd);
    mocha.ui(ui);
    return mocha;
}

function sortChunks(chunks, chunkGroups) {
    const nodeMap = {};
    chunks.forEach(chunk => {
        nodeMap[chunk.id] = chunk;
    });
    const edges = chunkGroups.reduce((result, chunkGroup) => result.concat(Array.from(chunkGroup.parentsIterable, parentGroup => [
        parentGroup,
        chunkGroup
    ])), []);
    const sortedGroups = toposort.array(chunkGroups, edges);
    const sortedChunks = sortedGroups
        .reduce((result, chunkGroup) => result.concat(chunkGroup.chunks), [])
        .map((chunk) => nodeMap[chunk.id])
        .filter((chunk, index, self) => {
        const exists = !!chunk;
        const unique = self.indexOf(chunk) === index;
        return exists && unique;
    });
    return sortedChunks;
}

const isBuilt = (module) => module.built;
const getId = (module) => module.id;
const affectedModules = (map, usageMap, affected, moduleId) => {
    if (typeof affected[moduleId] !== 'undefined') {
        return;
    }
    const module = map[moduleId];
    affected[module.id] = module;
    const usages = usageMap[module.id];
    if (typeof usages !== 'undefined') {
        const ids = Object.keys(usages);
        ids.forEach((id) => affectedModules(map, usageMap, affected, id));
    }
};
const buildModuleMap = (modules) => {
    const moduleMap = modules.reduce((memo, module) => ({ ...memo, [module.id]: module }), {});
    return moduleMap;
};
const buildModuleUsageMap = (chunks, modules) => {
    const moduleUsageMap = modules.reduce((memo, module) => {
        module.dependencies.forEach(dependency => {
            const dependentModule = dependency.module;
            if (!dependentModule) {
                return;
            }
            if (typeof memo[dependentModule.id] === 'undefined') {
                memo[dependentModule.id] = {};
            }
            memo[dependentModule.id][module.id] = module;
        });
        return memo;
    }, {});
    const chunkModuleMap = chunks.reduce((memo, chunk) => {
        memo[chunk.id] = {};
        return memo;
    }, {});
    modules.reduce((memo, module) => {
        module.getChunks().forEach((chunk) => {
            memo[chunk.id][module.id] = module;
        });
        return memo;
    }, chunkModuleMap);
    modules.forEach((module) => {
        module.blocks
            .filter(block => block.chunkGroup != null)
            .forEach(block => {
            block.chunkGroup.chunks.map(getId).forEach(chunkId => {
                Object.values(chunkModuleMap[chunkId]).forEach((childModule) => {
                    if (typeof moduleUsageMap[childModule.id] === 'undefined') {
                        moduleUsageMap[childModule.id] = {};
                    }
                    moduleUsageMap[childModule.id][module.id] = module;
                });
            });
        });
    });
    return moduleUsageMap;
};
function getAffectedModuleIds(chunks, modules) {
    const moduleMap = buildModuleMap(modules);
    const moduleUsageMap = buildModuleUsageMap(chunks, modules);
    const builtModules = modules.filter(isBuilt);
    const affectedMap = {};
    builtModules.forEach((module) => affectedModules(moduleMap, moduleUsageMap, affectedMap, module.id));
    return Object.values(affectedMap).map(getId);
}

function getBuildStats(stats, outputPath) {
    const { chunks, chunkGroups, modules } = stats.compilation;
    const sortedChunks = sortChunks(chunks, chunkGroups);
    const affectedModules = getAffectedModuleIds(chunks, modules);
    const entries = [];
    const js = [];
    const pathHelper = f => path.join(outputPath, f);
    sortedChunks.forEach((chunk) => {
        const files = Array.isArray(chunk.files) ? chunk.files : [chunk.files];
        if (chunk.isOnlyInitial()) {
            const entry = files[0];
            entries.push(entry);
        }
        if (chunk
            .getModules()
            .some((module) => affectedModules.indexOf(module.id) !== -1)) {
            files.forEach(file => {
                if (/\.js$/.test(file)) {
                    js.push(file);
                }
            });
        }
    });
    const buildStats = {
        affectedModules,
        affectedFiles: js.map(pathHelper),
        entries: entries.map(pathHelper)
    };
    return buildStats;
}

function buildProgressPlugin() {
    const bar = new ProgressBar(`  [:bar] ${chalk.bold(':percent')} (${chalk.dim(':msg')})`, {
        total: 100,
        complete: '=',
        incomplete: ' ',
        width: 25
    });
    return new ProgressPlugin((percent, msg) => {
        bar.update(percent, {
            msg: percent === 1 ? 'completed' : msg
        });
        if (percent === 1) {
            bar.terminate();
        }
    });
}

//entryPath, entryLoaderPath, includeLoaderPath


const noop$1 = () => undefined;

class TestRunner extends EventEmitter {
    constructor(entries, includes, options) {
        super();
        this.entries = entries;
        this.includes = includes;
        this.options = options;
    }
    
    prepareMocha(webpackConfig, stats) {
        const mocha = configureMocha(this.options);
        const outputPath = webpackConfig.output.path;
        const buildStats = getBuildStats(stats, outputPath);
        //@ts-ignore
        global.__webpackManifest__ = buildStats.affectedModules;
        buildStats.affectedFiles.forEach(filePath => {
            delete require.cache[filePath];
        });
        mocha.files = buildStats.entries;
        return mocha;
    }

    async run() {
        const { webpackConfig: config } = await this.createWebpackConfig();
        let failures = 0;
        const compiler = createCompiler(config);
        compiler.hooks.run.tapAsync('mochapack', (c, cb) => {
            this.emit('webpack:start');
            cb();
        });
        const dispose = registerInMemoryCompiler(compiler);
        try {
            failures = await new Promise((resolve, reject) => {
                registerReadyCallback(compiler, (err, webpackStats) => {
                    this.emit('webpack:ready', err, webpackStats);
                    if (err || !webpackStats) {
                        reject();
                        return;
                    }
                    try {
                        const mocha = this.prepareMocha(config, webpackStats);
                        this.emit('mocha:begin');
                        try {
                            mocha.run(fails => {
                                this.emit('mocha:finished', fails);
                                resolve(fails);
                            });
                        }
                        catch (e) {
                            this.emit('exception', e);
                            resolve(1);
                        }
                    }
                    catch (e) {
                        reject(e);
                    }
                });
                compiler.run(noop$1);
            });
        }
        finally {
            dispose();
        }
        return failures;
    }
    async watch() {
        const { webpackConfig: config, entryConfig } = await this.createWebpackConfig();
        let mochaRunner = null;
        let stats = null;
        let compilationScheduler = null;
        const uncaughtExceptionListener = err => {
            this.emit('uncaughtException', err);
        };
        const runMocha = () => {
            try {
                const mocha = this.prepareMocha(config, stats);
                //@ts-ignore
                process.removeListener('uncaughtException', uncaughtExceptionListener);
                this.emit('mocha:begin');
                mochaRunner = mocha.run(_.once(failures => {
                    process.on('uncaughtException', uncaughtExceptionListener);
                    process.nextTick(() => {
                        mochaRunner = null;
                        if (compilationScheduler != null) {
                            this.emit('mocha:aborted');
                            compilationScheduler();
                            compilationScheduler = null;
                        }
                        else {
                            this.emit('mocha:finished', failures);
                        }
                    });
                }));
            }
            catch (err) {
                this.emit('exception', err);
            }
        };
        const compiler = createCompiler(config);
        registerInMemoryCompiler(compiler);
        compiler.hooks.watchRun.tapAsync('mochapack', (c, cb) => {
            if (mochaRunner) {
                compilationScheduler = () => {
                    this.emit('webpack:start');
                    cb();
                };
                mochaRunner.abort();
                if (mochaRunner.currentRunnable) {
                    const runnable = mochaRunner.currentRunnable;
                    runnable.retries(0);
                    runnable.enableTimeouts(true);
                    runnable.timeout(1);
                    runnable.resetTimeout(1);
                }
            }
            else {
                this.emit('webpack:start');
                cb();
            }
        });
        registerReadyCallback(compiler, (err, webpackStats) => {
            this.emit('webpack:ready', err, webpackStats);
            if (err) {
                return;
            }
            stats = webpackStats;
            runMocha();
        });
        const watchCompiler = createWatchCompiler(compiler, config.watchOptions);
        watchCompiler.watch();
        const watchOptions = watchCompiler.getWatchOptions();
        const pollingInterval = typeof watchOptions.poll === 'number' ? watchOptions.poll : undefined;
        const watcher = chokidar.watch(this.entries, {
            cwd: this.options.cwd,
            ignoreInitial: true,
            persistent: true,
            followSymlinks: false,
            ignorePermissionErrors: true,
            ignored: watchOptions.ignored,
            usePolling: watchOptions.poll ? true : undefined,
            interval: pollingInterval,
            binaryInterval: pollingInterval
        });
        const restartWebpackBuild = _.debounce(() => watchCompiler.watch(), watchOptions.aggregateTimeout);
        const fileDeletedOrAdded = (file, deleted) => {
            const matchesGlob = this.entries.some(pattern => minimatch(file, pattern));
            if (matchesGlob) {
                const filePath = path.join(this.options.cwd, file);
                if (deleted) {
                    this.emit('entry:removed', file);
                    entryConfig.removeFile(filePath);
                }
                else {
                    this.emit('entry:added', file);
                    entryConfig.addFile(filePath);
                }
                watchCompiler.pause();
                restartWebpackBuild();
            }
        };
        watcher.on('add', file => fileDeletedOrAdded(file, false));
        watcher.on('unlink', file => fileDeletedOrAdded(file, true));
        return new Promise(() => undefined);
    }
    async createWebpackConfig() {
        const { webpackConfig } = this.options;
        const files = await glob(this.entries, {
            cwd: this.options.cwd,
            absolute: true
        });
        const entryConfig = new EntryConfig();
        files.forEach(f => entryConfig.addFile(f));
        const tmpPath = path.join(this.options.cwd, '.tmp', 'mochapack', Date.now().toString());
        const withCustomPath = _.has(webpackConfig, 'output.path');
        const outputPath = path.normalize(_.get(webpackConfig, 'output.path', tmpPath));
        const publicPath = withCustomPath
            ? _.get(webpackConfig, 'output.publicPath', undefined)
            : outputPath + path.sep;
        const plugins = [];
        if (this.options.interactive) {
            plugins.push(buildProgressPlugin());
        }
        const userLoaders = _.get(webpackConfig, 'module.rules', []);
        userLoaders.unshift({
            test: entryPath,
            use: [
                {
                    loader: includeLoaderPath,
                    options: {
                        include: this.includes
                    }
                },
                {
                    loader: entryLoaderPath,
                    options: {
                        entryConfig
                    }
                }
            ]
        });
        const config = {
            ...webpackConfig,
            entry: entryPath,
            module: {
                ...webpackConfig.module,
                rules: userLoaders
            },
            output: {
                ...webpackConfig.output,
                path: outputPath,
                publicPath
            },
            plugins: [...(webpackConfig.plugins || []), ...plugins]
        };
        return {
            webpackConfig: config,
            entryConfig
        };
    }
}

const syntaxErrorLabel = 'Syntax error:';
const replaceEol = message => message.replace(/\r?\n/g, '\n');
const useValidEol = (message) => message.replace('\n', EOL);
const stripStackTrace = (message) => message.replace(/^\s*at\s.*\(.+\)\n?/gm, '');
const cleanUpModuleNotFoundMessage = (message) => {
    if (message.indexOf('Module not found:') === 0) {
        return message
            .replace("Cannot resolve 'file' or 'directory' ", '')
            .replace('Cannot resolve module ', '')
            .replace("Error: Can't resolve ", '')
            .replace('Error: ', '');
    }
    return message;
};
const cleanUpBuildError = (message) => {
    if (message.indexOf('Module build failed:') === 0) {
        if (/Module build failed:\s*$/.test(message.split('\n')[0])) {
            const lines = message.split('\n');
            let replacement = lines[0];
            if (/File to import not found or unreadable/.test(message)) {
                replacement = 'Module not found:';
            }
            else if (/Invalid CSS/.test(message)) {
                replacement = syntaxErrorLabel;
            }
            lines[0] = replacement;
            message = lines.join('\n');
        }
        return message
            .replace('Module build failed: SyntaxError:', syntaxErrorLabel)
            .replace('Module build failed:', '');
    }
    return message;
};
const cleanUpUnwantedEol = message => message.replace(/\s*\n\s*$/, '');
const indent = (message) => message
    .split('\n')
    .map(l => `  ${l}`)
    .join('\n');
const formatErrorMessage = _.flow([
    replaceEol,
    stripStackTrace,
    cleanUpModuleNotFoundMessage,
    cleanUpBuildError,
    cleanUpUnwantedEol,
    indent,
    useValidEol
]);
const stripLoaderFromPath = (file) => {
    if (file.lastIndexOf('!') !== -1) {
        return file.substr(file.lastIndexOf('!') + 1);
    }
    return file;
};

const createGetFile = (requestShortener) => (e) => {
    if (e.file) {
        return e.file;
    }
    else if (e.module &&
        e.module.readableIdentifier &&
        typeof e.module.readableIdentifier === 'function') {
        return stripLoaderFromPath(e.module.readableIdentifier(requestShortener));
    }
    return null;
};
const ensureWebpackErrors = (errors) => errors.map((e) => {
    if (typeof e === 'string') {
        return { message: e };
    }
    return e;
});
const prependWarning = (message) => `${chalk.yellow('Warning')} ${message}`;
const prependError = (message) => `${chalk.red('Error')} ${message}`;
function createStatsFormatter(rootPath) {
    const requestShortener = new RequestShortener(rootPath);
    const getFile = createGetFile(requestShortener);
    const formatError = (err) => {
        const lines = [];
        const file = getFile(err);
        if (file != null) {
            lines.push(`in ${chalk.underline(file)}`);
            lines.push('');
        }
        else {
            lines.push('');
            lines.push('');
        }
        lines.push(formatErrorMessage(err.message));
        return lines.join(EOL);
    };
    return function statsFormatter(stats) {
        const { compilation } = stats;
        return {
            errors: ensureWebpackErrors(compilation.errors)
                .map(formatError)
                .map(prependError),
            warnings: ensureWebpackErrors(compilation.warnings)
                .map(formatError)
                .map(prependWarning)
        };
    };
}

const log = (...args) => {
    console.log(...args);
    console.log();
};

const formatTitleInfo = title => chalk.inverse('', title, '');
const formatTitleWarn = title => chalk.black.bgYellow('', title, '');
const formatTitleError = title => chalk.white.bold.bgRed('', title, '');
class Reporter {
    constructor(options) {
        this.onUncaughtException = (err) => {
            log(formatTitleError('UNCAUGHT EXCEPTION'), 'Exception occurred after running tests');
            log(err.stack);
        };
        this.onLoadingException = (err) => {
            log(formatTitleError('RUNTIME EXCEPTION'), 'Exception occurred while loading your tests');
            log(err.stack);
        };
        this.onWebpackStart = () => {
            this.clearTerminal();
            if (this.added.length > 0) {
                this.logInfo(formatTitleInfo('MOCHA'), 'The following test entry files were added:');
                this.logInfo(this.added.map(f => `+ ${f}`).join('\n'));
            }
            if (this.removed.length > 0) {
                this.logInfo(formatTitleInfo('MOCHA'), 'The following test entry files were removed:');
                this.logInfo(this.removed.map(f => `- ${f}`).join('\n'));
            }
            this.logInfo(formatTitleInfo('WEBPACK'), 'Compiling...');
            this.added.length = 0;
            this.removed.length = 0;
        };
        this.onWebpackReady = (err, stats) => {
            this.clearTerminal();
            if (stats != null) {
                const { errors, warnings } = this.formatStats(stats);
                if (errors.length === 0 && warnings.length === 0) {
                    const { startTime, endTime } = stats;
                    const compileTime = endTime - startTime;
                    this.logInfo(formatTitleInfo('WEBPACK'), `Compiled successfully in ${chalk.green(`${compileTime}ms`)}`);
                    return;
                }
                if (errors.length > 0) {
                    Reporter.displayErrors('error', errors);
                    return;
                }
                if (warnings.length > 0) {
                    Reporter.displayErrors('warning', warnings);
                }
            }
            else {
                Reporter.displayErrors('error', [err]);
            }
        };
        this.onMochaStart = () => {
            this.logInfo(formatTitleInfo('MOCHA'), 'Testing...');
        };
        this.onMochaAbort = () => {
            this.logInfo(formatTitleInfo('MOCHA'), 'Tests aborted');
        };
        this.onMochaReady = (failures) => {
            if (failures === 0) {
                this.logInfo(formatTitleInfo('MOCHA'), `Tests completed ${chalk.green('successfully')}`);
            }
            else {
                this.logInfo(formatTitleInfo('MOCHA'), `Tests completed with ${chalk.red(`${failures} failure(s)`)}`);
            }
        };
        this.onEntryAdded = (file) => {
            this.added.push(file);
        };
        this.onEntryRemoved = (file) => {
            this.removed.push(file);
        };
        const { cwd, eventEmitter } = options;
        this.options = options;
        this.added = [];
        this.removed = [];
        this.formatStats = createStatsFormatter(cwd);
        eventEmitter.on('uncaughtException', this.onUncaughtException);
        eventEmitter.on('exception', this.onLoadingException);
        eventEmitter.on('webpack:start', this.onWebpackStart);
        eventEmitter.on('webpack:ready', this.onWebpackReady);
        eventEmitter.on('mocha:begin', this.onMochaStart);
        eventEmitter.on('mocha:aborted', this.onMochaAbort);
        eventEmitter.on('mocha:finished', this.onMochaReady);
        eventEmitter.on('entry:added', this.onEntryAdded);
        eventEmitter.on('entry:removed', this.onEntryRemoved);
    }
    logInfo(...args) {
        if (!this.options.quiet) {
            log(...args);
        }
    }
    clearTerminal() {
        if (this.options.clearTerminal && this.options.interactive) {
            process.stdout.write(process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H');
        }
    }
    static displayErrors(severity, errors) {
        const errorCount = errors.length;
        const message = severity === 'error'
            ? `Failed to compile with ${chalk.red(`${errorCount} ${severity}(s)`)}`
            : `Compiled with ${chalk.yellow(`${errorCount} ${severity}(s)`)}`;
        const titleColor = severity === 'error' ? formatTitleError : formatTitleWarn;
        log(titleColor('WEBPACK'), message);
        errors.forEach(err => log(err));
    }
}
function testRunnerReporter(options) {
    new Reporter(options);
}

class MochaWebpack {
    constructor() {
        this.entries = [];
        this.includes = [];
        this.options = {
            cwd: process.cwd(),
            webpackConfig: {},
            bail: false,
            reporter: 'spec',
            reporterOptions: {},
            ui: 'bdd',
            invert: false,
            ignoreLeaks: true,
            fullStackTrace: false,
            inlineDiffs: false,
            timeout: 2000,
            slow: 75,
            asyncOnly: false,
            delay: false,
            interactive: !!process.stdout.isTTY,
            clearTerminal: false,
            quiet: false,
            forbidOnly: false
        };
    }
    addEntry(file) {
        this.entries = [...this.entries, file];
        return this;
    }
    addInclude(file) {
        this.includes = [...this.includes, file];
        return this;
    }
    cwd(cwd) {
        this.options = {
            ...this.options,
            cwd
        };
        return this;
    }
    webpackConfig(config = {}) {
        this.options = {
            ...this.options,
            webpackConfig: config
        };
        return this;
    }
    bail(bail = false) {
        this.options = {
            ...this.options,
            bail
        };
        return this;
    }
    reporter(reporter, reporterOptions) {
        this.options = {
            ...this.options,
            reporter,
            reporterOptions
        };
        return this;
    }
    ui(ui) {
        this.options = {
            ...this.options,
            ui
        };
        return this;
    }
    fgrep(str) {
        this.options = {
            ...this.options,
            fgrep: str
        };
        return this;
    }
    grep(pattern) {
        this.options = {
            ...this.options,
            grep: pattern
        };
        return this;
    }
    invert() {
        this.options = {
            ...this.options,
            invert: true
        };
        return this;
    }
    ignoreLeaks(ignore) {
        this.options = {
            ...this.options,
            ignoreLeaks: ignore
        };
        return this;
    }
    fullStackTrace() {
        this.options = {
            ...this.options,
            fullStackTrace: true
        };
        return this;
    }

    color(colors) {
        this.options = {
            ...this.options,
            colors
        };
        return this;
    }

    quiet() {
        this.options = {
            ...this.options,
            quiet: true
        };
        return this;
    }
    
    inlineDiffs(inlineDiffs) {
        this.options = {
            ...this.options,
            inlineDiffs: inlineDiffs
        };
        return this;
    }
    timeout(timeout) {
        this.options = {
            ...this.options,
            timeout
        };
        return this;
    }
    retries(count) {
        this.options = {
            ...this.options,
            retries: count
        };
        return this;
    }
    slow(threshold) {
        this.options = {
            ...this.options,
            slow: threshold
        };
        return this;
    }
    asyncOnly() {
        this.options = {
            ...this.options,
            asyncOnly: true
        };
        return this;
    }
    delay() {
        this.options = {
            ...this.options,
            delay: true
        };
        return this;
    }
    interactive(interactive) {
        this.options = {
            ...this.options,
            interactive
        };
        return this;
    }
    clearTerminal(clearTerminal) {
        this.options = {
            ...this.options,
            clearTerminal
        };
        return this;
    }
    growl() {
        this.options = {
            ...this.options,
            growl: true
        };
        return this;
    }
    forbidOnly() {
        this.options = {
            ...this.options,
            forbidOnly: true
        };
        return this;
    }
    async run() {
        const runner = new TestRunner(this.entries, this.includes, this.options);
        testRunnerReporter({
            eventEmitter: runner,
            interactive: this.options.interactive,
            quiet: this.options.quiet,
            cwd: this.options.cwd,
            clearTerminal: this.options.clearTerminal
        });
        return runner.run();
    }
    async watch() {
        const runner = new TestRunner(this.entries, this.includes, this.options);
        testRunnerReporter({
            eventEmitter: runner,
            interactive: this.options.interactive,
            quiet: this.options.quiet,
            cwd: this.options.cwd,
            clearTerminal: this.options.clearTerminal
        });
        await runner.watch();
    }
}

function createMochaWebpack() {
    return new MochaWebpack();
}

function resolve(mod) {
    const absolute = existsFileSync(mod) || existsFileSync(`${mod}.js`);
    const file = absolute ? path.resolve(mod) : mod;
    return file;
}

function exit(lazy, code) {
    if (lazy) {
        process.on('exit', () => {
            process.exit(code);
        });
    }
    else {
        process.exit(code);
    }
}

async function cli() {
    const cliOptions = parseArgv(process.argv.slice(2), true);
    const configOptions = parseConfig(cliOptions.opts);
    const requiresWebpackConfig = cliOptions.webpackConfig != null || configOptions.webpackConfig != null;
    const defaultOptions = parseArgv([]);
    const options = _.defaults({}, cliOptions, configOptions, defaultOptions);
    options.require.forEach(mod => {
        require(resolve(mod));
    });
    options.include = options.include.map(resolve);
    options.webpackConfig = await requireWebpackConfig(options.webpackConfig, requiresWebpackConfig, options.webpackEnv, options.mode);
    const mochaWebpack = createMochaWebpack();
    options.include.forEach(f => mochaWebpack.addInclude(f));
    const extensions = _.get(options.webpackConfig, 'resolve.extensions', ['.js']);
    const fallbackFileGlob = extensionsToGlob(extensions);
    const fileGlob = options.glob != null ? options.glob : fallbackFileGlob;
    options.files.forEach(f => mochaWebpack.addEntry(ensureGlob(f, options.recursive, fileGlob)));
    mochaWebpack.cwd(process.cwd());
    mochaWebpack.webpackConfig(options.webpackConfig);
    mochaWebpack.bail(options.bail);
    mochaWebpack.reporter(options.reporter, options.reporterOptions);
    mochaWebpack.ui(options.ui);
    mochaWebpack.interactive(options.interactive);
    mochaWebpack.clearTerminal(options.clearTerminal);
    if (options.fgrep) {
        mochaWebpack.fgrep(options.fgrep);
    }
    if (options.grep) {
        mochaWebpack.grep(options.grep);
    }
    if (options.invert) {
        mochaWebpack.invert();
    }
    if (options.checkLeaks) {
        mochaWebpack.ignoreLeaks(false);
    }
    if (options.fullTrace) {
        mochaWebpack.fullStackTrace();
    }
    if (options.quiet) {
        mochaWebpack.quiet();
    }
    mochaWebpack.color(options.colors);
    
    mochaWebpack.inlineDiffs(options.inlineDiffs);
    mochaWebpack.timeout(options.timeout);
    if (options.retries) {
        mochaWebpack.retries(options.retries);
    }
    mochaWebpack.slow(options.slow);
    if (options.asyncOnly) {
        mochaWebpack.asyncOnly();
    }
    if (options.delay) {
        mochaWebpack.delay();
    }
    if (options.growl) {
        mochaWebpack.growl();
    }
    if (options.forbidOnly) {
        mochaWebpack.forbidOnly();
    }

    
    await Promise.resolve().then(() => {
        if (options.watch) {
            return mochaWebpack.watch();
        }
        return mochaWebpack.run();
    })
        .then((failures) => {
        exit(options.exit, failures);
    })
        .catch(e => {
        if (e) {
            console.error(e.stack);
        }
        exit(options.exit, 1);
    });
}

cli();
