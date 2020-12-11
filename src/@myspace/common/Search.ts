import * as StringUtils from "./String";
import * as LangUtils from "./Lang";

interface IContainsTextOptions {
    matcher: (text: string, match: string) => boolean;
}

const DefaultContainsTextOptions : IContainsTextOptions = {
    matcher: StringUtils.containsIgnoreCase
};

const containsTextImmediate = function(o : any, text : string, matcher : (text: string, match: string) => boolean) : boolean {
    if(o) {
        if(LangUtils.isArray(o) || (o && LangUtils.isFunction(o.some))) {
            return o.some(value => {
                return containsTextImmediate(value, text, matcher);
            });
        }
        
        if(LangUtils.isObject(o)) {
            return Object.keys(o).some(key => {
                return containsTextImmediate(o[key], text, matcher);
            });
        }
        
        return matcher(String(o), text);
    }
    return false;
};

const containsText = (o : any, text : string, opts : IContainsTextOptions = DefaultContainsTextOptions) => {
    const matcher = opts.matcher ? opts.matcher : DefaultContainsTextOptions.matcher;
    return containsTextImmediate(o, text, matcher);
};

export { containsText, IContainsTextOptions, DefaultContainsTextOptions };