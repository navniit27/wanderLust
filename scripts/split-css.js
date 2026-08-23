const fs = require("fs");

const css = fs.readFileSync("public/css/style.css", "utf8");

const vars = css.match(/\/\* =+\s+WANDERLUST[\s\S]*?(?=\/\* =+\s+GLOBAL)/);
const base = css.match(/\/\* =+\s+GLOBAL[\s\S]*?(?=\/\* =+\s+NAVBAR)/);
const navbar = css.match(/\/\* =+\s+NAVBAR[\s\S]*?(?=\/\* =+\s+SEARCH)/);
const listings = css.match(/\/\* =+\s+SEARCH[\s\S]*?(?=\/\* =+\s+CREATE \/ EDIT)/);
const forms = css.match(/\/\* =+\s+CREATE \/ EDIT BUTTONS[\s\S]*?(?=\/\* =+\s+SHOW PAGE)/);
const show = css.match(/\/\* =+\s+SHOW PAGE[\s\S]*?(?=\/\* =+\s+FOOTER)/);
const footer = css.match(/\/\* =+\s+FOOTER[\s\S]*?(?=\/\* =+\s+TABLET)/);
const responsive = css.match(/\/\* =+\s+TABLET[\s\S]*/);

if (![vars, base, navbar, listings, forms, show, footer, responsive].every(Boolean)) {
    console.error("Failed to parse CSS sections");
    process.exit(1);
}

fs.writeFileSync("public/css/variables.css", vars[0]);
fs.writeFileSync("public/css/base.css", base[0]);
fs.writeFileSync("public/css/navbar.css", navbar[0]);
fs.writeFileSync("public/css/listings.css", `${listings[0]}\n${show[0]}`);
fs.writeFileSync("public/css/forms.css", forms[0]);
fs.writeFileSync("public/css/footer.css", footer[0]);
fs.writeFileSync("public/css/responsive.css", responsive[0]);

fs.writeFileSync(
    "public/css/style.css",
    [
        "/* Split into modules; kept for backward compatibility */",
        '@import url("./variables.css");',
        '@import url("./base.css");',
        '@import url("./navbar.css");',
        '@import url("./listings.css");',
        '@import url("./forms.css");',
        '@import url("./footer.css");',
        '@import url("./responsive.css");',
        "",
    ].join("\n")
);

console.log("css split ok");
