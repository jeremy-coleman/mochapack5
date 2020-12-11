export interface IPredicateFunc<T = any, S = T[]> {
    (value : T, index?: number, source?: S) : boolean;
}


const not = <T = any, S = T[]>(pr : IPredicateFunc<T, S>) : IPredicateFunc<T, S> => {
    return (value, idx, source) => {
        return !pr(value, idx, source);
    };
};

const and = <T = any, S = T[]>(...prs : IPredicateFunc<T, S>[]) : IPredicateFunc<T, S> => {
    return (value, idx, source) => {
        return prs.every(pr => {
            return pr(value, idx, source);
        });
    };
};

const or = <T = any, S = T[]>(...prs : IPredicateFunc<T, S>[]) : IPredicateFunc<T, S> => {
    return (value, idx, source) => {
        return prs.some(pr => {
            return pr(value, idx, source);
        });
    };
};

export { not, and, or }