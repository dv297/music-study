# Pinned to the exact @playwright/test version in package.json. Each tag of
# this image ships the browser build that version of Playwright expects
# already installed at $PLAYWRIGHT_BROWSERS_PATH, so `npm ci` doesn't need to
# download anything and CI can't drift onto a mismatched browser build.
FROM mcr.microsoft.com/playwright:v1.56.1-noble

WORKDIR /app

# The image above already has the matching browsers; skip re-downloading them.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

CMD ["npm", "run", "test:e2e"]
