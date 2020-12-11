import loaderUtils from 'loader-utils';

function includeFilesLoader(sourceCode) {
    if (this.cacheable) {
        this.cacheable();
    }
    const loaderOptions = loaderUtils.getOptions(this);
    if (loaderOptions.include && loaderOptions.include.length) {
        const includes = loaderOptions.include
            .map(modPath => `require(${loaderUtils.stringifyRequest(this, modPath)});`)
            .join('\n');
        const code = [includes, sourceCode].join('\n');
        this.callback(null, code, null);
        return;
    }
    this.callback(null, sourceCode, null);
};

export default includeFilesLoader;
