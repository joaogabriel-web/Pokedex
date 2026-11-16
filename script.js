const form = document.querySelector("#pokemon-form");
const input = document.querySelector("#pokemon-name");
const results = document.querySelector("#results");
let activeSearch = 0;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const searchId = ++activeSearch;

  // const name = input.value.trim().toLowerCase();
  const name = input.value
  .trim()
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "") // remove acentos
  .replace(/[.'’:]/g, "")         // remove pontos e pontuação
  .replace(/\s+/g, "-");           // espaços viram hífens

  if (!name) {
    showMessage("Digite o nome de um Pokémon.", true);
    return;
  }

  showMessage("Buscando Pokémon...");

  try {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(name)}`
    );

    if (searchId !== activeSearch) return;

    if (response.status === 404) {
      showMessage("Pokémon não encontrado. Confira o nome e tente novamente.", true);
      return;
    }

    if (!response.ok) {
      throw new Error("A API respondeu com um erro.");
    }

    const pokemon = await response.json();
    if (searchId === activeSearch) {
      showPokemon(pokemon, searchId);
    }
  } catch {
    if (searchId === activeSearch) {
      showMessage("Não foi possível acessar a PokéAPI. Tente novamente.", true);
    }
  }
});

function showMessage(message, isError = false) {
  results.replaceChildren();

  const paragraph = document.createElement("p");
  paragraph.textContent = message;

  if (isError) {
    paragraph.classList.add("error");
  }

  results.append(paragraph);
}

function showPokemon(pokemon, searchId) {
  results.replaceChildren();

  const title = document.createElement("h2");
  title.textContent = pokemon.name;
  results.append(title);

  const imageUrl =
    pokemon.sprites.other?.["official-artwork"]?.front_default ||
    pokemon.sprites.front_default;

  if (imageUrl) {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = `Imagem do Pokémon ${pokemon.name}`;
    image.classList.add("pokemon-image");
    results.append(image);
  }

  const details = document.createElement("ul");

  const information = [
    `ID: ${pokemon.id}`,
    `Altura: ${pokemon.height / 10} metros`,
    `Peso: ${pokemon.weight / 10} kg`
  ];

  for (const text of information) {
    const item = document.createElement("li");
    item.textContent = text;
    details.append(item);
  }

  const abilitiesTitle = document.createElement("h3");
  abilitiesTitle.textContent = "Habilidades:";

  const abilities = document.createElement("ul");

  for (const entry of pokemon.abilities) {
    const item = document.createElement("li");
    item.textContent = entry.ability.name;
    abilities.append(item);
  }

  const evolutionSection = document.createElement("section");
  evolutionSection.classList.add("evolutions");

  const evolutionTitle = document.createElement("h3");
  evolutionTitle.textContent = "Evoluções:";

  const loadingMessage = document.createElement("p");
  loadingMessage.textContent = "Carregando evoluções...";
  evolutionSection.append(evolutionTitle, loadingMessage);

  results.append(details, abilitiesTitle, abilities, evolutionSection);
  loadEvolutions(pokemon, evolutionSection, searchId);
}

async function loadEvolutions(pokemon, section, searchId) {
  try {
    const speciesResponse = await fetch(pokemon.species.url);
    if (!speciesResponse.ok) {
      throw new Error("Não foi possível carregar os dados da espécie.");
    }

    const species = await speciesResponse.json();
    const chainResponse = await fetch(species.evolution_chain.url);
    if (!chainResponse.ok) {
      throw new Error("Não foi possível carregar a cadeia evolutiva.");
    }

    const chainData = await chainResponse.json();
    const currentSpecies = findSpeciesInChain(
      chainData.chain,
      pokemon.species.name
    );

    if (!currentSpecies) {
      throw new Error("O Pokémon não foi encontrado na cadeia evolutiva.");
    }

    if (searchId !== activeSearch) return;

    section.replaceChildren();
    const title = document.createElement("h3");
    title.textContent = "Evoluções:";
    section.append(title);

    if (currentSpecies.evolves_to.length === 0) {
      const message = document.createElement("p");
      message.textContent = "Este Pokémon não possui evoluções.";
      section.append(message);
      return;
    }

    const list = document.createElement("ul");
    list.classList.add("evolution-list");
    const items = await Promise.all(
      currentSpecies.evolves_to.map(createEvolutionItem)
    );

    if (searchId !== activeSearch) return;
    list.append(...items);
    section.append(list);
  } catch {
    if (searchId !== activeSearch) return;

    section.replaceChildren();
    const title = document.createElement("h3");
    title.textContent = "Evoluções:";
    const message = document.createElement("p");
    message.textContent = "Não foi possível carregar as evoluções.";
    message.classList.add("error");
    section.append(title, message);
  }
}

function findSpeciesInChain(node, speciesName) {
  if (node.species.name === speciesName) {
    return node;
  }

  for (const evolution of node.evolves_to) {
    const match = findSpeciesInChain(evolution, speciesName);
    if (match) return match;
  }

  return null;
}

async function createEvolutionItem(evolution) {
  const response = await fetch(
    `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(evolution.species.name)}`
  );
  if (!response.ok) {
    throw new Error(`Não foi possível carregar ${evolution.species.name}.`);
  }

  const evolvedPokemon = await response.json();
  const item = document.createElement("li");
  item.classList.add("evolution-item");

  const imageUrl =
    evolvedPokemon.sprites.other?.["official-artwork"]?.front_default ||
    evolvedPokemon.sprites.front_default;

  if (imageUrl) {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = "";
    image.loading = "lazy";
    item.append(image);
  }

  const name = document.createElement("span");
  name.textContent = evolution.species.name;
  item.append(name);

  if (evolution.evolves_to.length > 0) {
    const branches = document.createElement("ul");
    branches.classList.add("evolution-list");
    const children = await Promise.all(
      evolution.evolves_to.map(createEvolutionItem)
    );
    branches.append(...children);
    item.append(branches);
  }

  return item;
}