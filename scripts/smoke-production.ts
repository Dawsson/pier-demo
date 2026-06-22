type SmokeTarget = {
  readonly expect: (response: Response, body: string) => void | Promise<void>;
  readonly init?: RequestInit;
  readonly name: string;
  readonly required?: boolean;
  readonly url: string | undefined;
};

const webURL = envURL("SMOKE_WEB_URL", "https://pier-demo.buildwithharbor.com");
const adminURL = envURL("SMOKE_ADMIN_URL", "https://admin.pier-demo.buildwithharbor.com");
const apiURL = envURL("SMOKE_API_URL", "https://api.pier-demo.buildwithharbor.com");
const zeroURL = envURL("SMOKE_ZERO_URL", process.env.PIER_ZERO_CACHE_URL);

const targets: readonly SmokeTarget[] = [
  {
    expect: expectStatus([200]),
    name: "web",
    url: webURL,
  },
  {
    expect: expectStatus([200, 302, 307, 308]),
    name: "admin",
    url: adminURL,
  },
  {
    expect: async (response, body) => {
      expectStatus([200])(response, body);
      const health = JSON.parse(body) as { readonly ok?: unknown };
      if (health.ok !== true) {
        throw new Error(`Expected API status ok=true, received ${body}`);
      }
    },
    name: "api status",
    url: apiURL ? new URL("/status", apiURL).toString() : undefined,
  },
  {
    expect: async (response, body) => {
      expectStatus([200])(response, body);
      const result = JSON.parse(body) as { readonly ok?: unknown };
      if (result.ok !== true) {
        throw new Error(`Expected counter ok=true, received ${body}`);
      }
    },
    init: {
      body: "{}",
      headers: { "content-type": "application/json" },
      method: "POST",
    },
    name: "public counter",
    url: apiURL ? new URL("/rpc/publicCounter/current", apiURL).toString() : undefined,
  },
  {
    expect: (response, body) => {
      expectStatus([200])(response, body);
      if (body.trim() !== "OK") {
        throw new Error(`Expected Zero keepalive OK, received ${body}`);
      }
    },
    name: "zero keepalive",
    required: true,
    url: zeroURL ? new URL("/keepalive", zeroURL).toString() : undefined,
  },
];

for (const target of targets) {
  await smoke(target);
}

async function smoke(target: SmokeTarget) {
  if (!target.url) {
    if (target.required) {
      throw new Error(`${target.name} URL is required.`);
    }
    console.log(`skip ${target.name}: URL not configured`);
    return;
  }

  const response = await fetch(target.url, {
    redirect: "manual",
    ...target.init,
  });
  const body = await response.text();
  await target.expect(response, body);
  console.log(`ok ${target.name}: ${response.status}`);
}

function expectStatus(statuses: readonly number[]) {
  return (response: Response, body: string) => {
    if (!statuses.includes(response.status)) {
      throw new Error(
        `Expected ${response.url} to return ${statuses.join(" or ")}, got ${response.status}: ${body}`,
      );
    }
  };
}

function envURL(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  return value && value.length > 0 ? value : undefined;
}
