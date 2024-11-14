function isCaseInsensitiveEqual(source, target) {
    if (!target || !source) return false;
    if (source.toLowerCase() === target.toLowerCase()) return true;
}

const isUndefined = (p) => {
    return p === undefined;
}

module.exports = {
    isCaseInsensitiveEqual,
    isUndefined
}