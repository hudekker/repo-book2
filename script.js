// "use strict";

let limits;
let list;
let boolGist = false;
let boolSubmit;
let username;
let sortedBy = "Created";
let titleSearch = document.querySelector("#title-search");
let inputUsername = document.querySelector("#input-username");
let btnSearch = document.querySelector("#btn-search");
let btnGithub = document.querySelector("#btn-github");
let btnGist = document.querySelector("#btn-gist");
let btnGo = document.querySelector("#btn-go");

const getRowName = (row) => {
  let rowName;

  if (boolGist) {
    rowName = Object.keys(row.files).length ? Object.values(row.files)[0].filename : "";
  } else {
    rowName = row.name;
  }

  return rowName;
};

const headers = [
  {
    name: "Description",
    key: (e) => e.description || getRowName(e),
    boolAscending: true,
  },
  {
    name: "Name",
    key: getRowName,
    boolAscending: true,
  },
  {
    name: "Created",
    key: (e) => e.created_at,
    boolAscending: false,
  },
  {
    name: "Updated",
    key: (e) => e.updated_at,
    boolAscending: false,
  },
];

// class GHRequestError extends Error {
//   constructor(limits = {}, ...params) {
//     super(...params);

//     if (Error.captureStackTrace) {
//       Error.captureStackTrace(this, GHRequestError);
//     }

//     this.name = "GHRequestError";
//     this.limits = limits;
//   }
// }

const getDescription = (row) => {
  let desc;

  if (boolGist) {
    desc = `
      <a href="${row.html_url}" >
        ${row.description || (Object.keys(row.files).length ? Object.values(row.files)[0].filename : "<em>no description</em>")}
      </a>
    `;

    // Github repo
  } else {
    desc = `
        <a href="${row.html_url}" >
          ${row.description || "<em>no description</em>"}
        </a>
      `;
  }

  return desc;
};

const getName = (row) => {
  let name;

  if (boolGist) {
    name = `
    <a href="${row.html_url}" >
        ${getRowName(row) || "<em>no description</em>"}
    </a>
    `;

    // Github repo
  } else {
    name = `
        <a href="${row.html_url}">
          ${row.name || "<em>no name</em>"}
        </a>
      `;
  }

  return name;
};

const buildTableRow = (row) => `
  <tr>
    <td>
      ${getDescription(row)}
    </td>
    <td>
      ${getName(row)}
    </td>
    <td>
      ${row.created_at.slice(0, 10)}
    </td>
    <td>
      ${row.updated_at.slice(0, 10)}
    </td>
  </tr>
`;

const buildTable = (list) =>
  list.length === 0
    ? "<div>Nothing found</div>"
    : `
  <table>
    <tbody>
      <tr>
        ${headers.map(({ name }) => `<th>${name}</th>`).join("")}
      </tr>
      ${list.map(buildTableRow).join("")}
    </tbody>
  </table>
`;

const listenToHeaderClick = (header) => {
  header.addEventListener("click", (evt) => {
    let colHeading = evt.target.innerText;

    // Get the function key and default sort direction for this colHeading
    let { key, boolAscending } = headers.find((e) => e.name === colHeading);

    // sortedBy is global and remembers last col sort.
    // If sorted twice in a row then reverse previous
    if (sortedBy === colHeading) {
      list.reverse();
      boolAscending = header.classList.contains("sorted-desc");

      // If "new" to this column then always use default sort
      // Use the key() to sort rows
    } else {
      sortedBy = colHeading;
      list.sort((a, b) => key(a).localeCompare(key(b)));

      if (!boolAscending) {
        list.reverse();
      }
    }

    // rebuild the dom using this sorted list
    listToDOM(list);

    // update the asc or desc icon for this colHeading
    showSortedIcon(boolAscending);
  });
};

const showSortedIcon = (boolAscending) => {
  document.querySelectorAll(".tbl-search th").forEach((e) => {
    if (e.innerText === sortedBy) {
      e.classList.add(boolAscending ? "sorted-asc" : "sorted-desc");
    }
  });
};

const listToDOM = (list) => {
  // Rebuild the dom using the list in memory
  document.querySelector(".tbl-search").innerHTML = buildTable(list);

  // Add event listeners just for the col headers
  document.querySelectorAll(".tbl-search th").forEach(listenToHeaderClick);
};

const limitsToDOM = (limits) => {
  document.querySelector(".github-limits").innerHTML = `
    <small>
      <em>
        ${limits.remaining}/${limits.limit} API requests remaining.
        Usage resets at ${limits.reset}.
      </em>
    </small>
  `;
};

// const handleGistsResponse = (response) => {
//   ({ limits, gists } = response);
//   limitsToDOM(limits);
//   gistsToDOM(gists);
//   showSortedIcon(headers.find((e) => e.name === sortedBy).ascending);
// };

// const handleError = (err) => {
//   const gistsEl = document.querySelector(".gists");
//   gistsEl.innerHTML = err.message;
//   limitsToDOM(err.limits);
// };

btnGithub.addEventListener("click", (e) => {
  e.preventDefault();

  const searchParams = new URLSearchParams(window.location.ref);
  searchParams.set("boolGist", "false");
  searchParams.set("username", `${document.querySelector("#input-username").value}`);
  searchParams.set("boolSubmit", "false");

  window.location.search = `?${searchParams.toString()}`;
});

btnGist.addEventListener("click", (e) => {
  e.preventDefault();

  const searchParams = new URLSearchParams(window.location.ref);
  searchParams.set("boolGist", "true");
  searchParams.set("username", `${document.querySelector("#input-username").value}`);
  searchParams.set("boolSubmit", "false");

  window.location.search = `?${searchParams.toString()}`;
});

const buildList = async () => {
  list = [];

  username = document.querySelector("#input-username").value;

  for (let page = 1; page <= 1; page++) {
    const url = boolGist ? `https://api.github.com/users/${username}/gists?page=${page}&per_page=100` : `https://api.github.com/users/${username}/repos?page=${page}&per_page=100`;

    let response = await fetch(url);

    const { headers } = response;

    limits = {
      remaining: response.headers.get("x-ratelimit-remaining"),
      limit: response.headers.get("x-ratelimit-limit"),
      reset: new Date(response.headers.get("x-ratelimit-reset") * 1000),
    };

    let data = await response.json();

    // const { limits: lastLimits, payload: chunk } = await fetchJson(url);
    // limits = lastLimits;

    list.push(...data);

    if (data.length < 100) {
      break;
    }
  }

  limitsToDOM(limits);
  listToDOM(list);
  showSortedIcon(headers.find((e) => e.name === sortedBy).boolAscending);
};

const onLoadRefresh = () => {
  const searchParams = new URLSearchParams(window.location.search);

  boolGist = searchParams.get("boolGist") === "true";
  boolSubmit = searchParams.get("boolSubmit") === "true";

  username = searchParams.get("username");
  document.querySelector("#input-username").value = username;

  if (boolGist) {
    btnGithub.classList.remove("on");
    btnGist.classList.add("on");
    inputUsername.placeholder = `Enter a Gist username`;
    titleSearch.innerText = "Gist List";
    titleSearch.classList.add("gist");
  } else {
    inputUsername.placeholder = `Enter a Github username`;
    titleSearch.innerText = "Github List";
  }

  if (username && boolSubmit) {
    buildList(username);
  }
};

btnSearch.addEventListener("click", (event) => {
  event.preventDefault();

  const searchParams = new URLSearchParams(window.location.ref);
  searchParams.set("boolGist", `${boolGist}`);
  searchParams.set("boolSubmit", `true`);
  searchParams.set("username", `${document.querySelector("#input-username").value}`);

  window.location.search = `?${searchParams.toString()}`;
});

onLoadRefresh();
