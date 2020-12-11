import loaderUtils from 'loader-utils';

function createEntry(filePaths) {
    return [
        '// runtime helper',
        'function inManifest(id) { return global.__webpackManifest__.indexOf(id) >= 0;}',
        'function run(id) { __webpack_require__(id);}',
        '',
        '// modules to execute goes here',
        'var ids = [',
        filePaths.map(path => `require.resolve(${path})`).join(','),
        '];',
        '',
        'ids.filter(inManifest).forEach(run)'
    ].join('\n');
}

export function entryLoader() {
    const loaderOptions = loaderUtils.getOptions(this);
    const config = loaderOptions.entryConfig;
    this.clearDependencies();
    const dependencies = config
        .getFiles()
        .map(file => loaderUtils.stringifyRequest(this, file));
    dependencies.forEach(this.addDependency.bind(this));
    const sourceCode = createEntry(dependencies);
    this.callback(null, sourceCode, null);
};

export default entryLoader;
