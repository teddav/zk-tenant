# zkTenant

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Noir](https://img.shields.io/badge/Built%20With-Noir-blue)](https://noir-lang.org/)

**zkTenant** is an app designed to verify **[2D-Doc](https://ants.gouv.fr/nos-missions/les-solutions-numeriques/2d-doc) documents** to create a housing application without sharing more information than necessary.

## How it works

The app allows you to share proof that you are French and that your income is higher than a certain amount without disclosing any other detail. For this, it uses your tax return document and your French ID, both of which being signed with 2D-Doc.

[2D-Doc](https://ants.gouv.fr/nos-missions/les-solutions-numeriques/2d-doc) is a structured digital signature standard widely used for secure document authentication.

Components:

- **[2D-Doc](https://ants.gouv.fr/nos-missions/les-solutions-numeriques/2d-doc)** barcode for documents, used with:
    - Tax return document
    - Post-2021 French ID card
- **[tdd.nr](https://github.com/teddav/tdd.nr)** (based on [Noir](https://noir-lang.org/)): ensuring efficient and privacy-preserving computations.

---

## How to run

To set up the project locally:

1. Clone the repository:

```sh
git clone https://github.com/teddav/zk-tenant.git
```

2. Install dependencies:

```sh
cd zk-tenant
npm install
```

3. Run the development server:

```sh
npm run dev
```

This will start the Next.js development server.

---

## Contributing

Contributions are welcome! To get started:

- Fork this repository.
- Create a feature branch for your changes.
- Submit a pull request detailing your improvements.

---

## Sponsor
<p align="left">
  <a href="https://hyle.eu" target="_blank"> <img src="https://blog.hyle.eu/content/images/2024/10/Hyl-_widelogo_lightbg.png" width="15%", height="15%"/></a>
</p>

*This project is supported by [Hylé](https://hyle.eu), the next-gen base layer for unchained apps.*