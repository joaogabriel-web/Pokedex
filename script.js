const form = document.querySelector("#pokemon-form");
const input = document.querySelector("#pokemon-name");
const results = document.querySelector("#results");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = input.value.trim().toLowerCase();

  if (!name) {
    showMessage("Digite o nome de um Pokémon.", true);
    return;
  }

  showMessage("Buscando Pokémon...");

  try {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(name)}`
    );

    if (response.status === 404) {
      showMessage("Pokémon não encontrado. Confira o nome e tente novamente.", true);
      return;
    }

    if (!response.ok) {
      throw new Error("A API respondeu com um erro.");
    }

    const pokemon = await response.json();
    showPokemon(pokemon);
  } catch {
    showMessage("Não foi possível acessar a PokéAPI. Tente novamente.", true);
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

function showPokemon(pokemon) {
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

  results.append(details, abilitiesTitle, abilities);
}