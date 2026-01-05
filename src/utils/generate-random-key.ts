export const generateProductKey = (title:string, category:string) => {
    const randomKey = `${title}-${category}`;
    return randomKey;
}