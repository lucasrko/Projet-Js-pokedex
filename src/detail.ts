
import { fetchNomPokemon, fetchGenericURL } from './api.ts'
import { ajouterPokemon } from './équipe.ts';
export async function afficherFicheDetaillee(nomOuId: string | number) {
    const liste = document.querySelector<HTMLUListElement>('#pokemon-list')!;
    const pagination = document.querySelector<HTMLDivElement>('.pagination-controls')!;
    const detail = document.querySelector<HTMLUListElement>('#pokemon-detail')!;

    pagination.style.display = "none";
    liste.style.display = "none";
    detail.style.display = "block";

    detail.innerHTML = "<div class='loading'>CHARGEMENT DES DONNÉES...</div>";

    try {
        // 1. Info principale (converti en string au cas où on passe un nombre)
        const pokemon = await fetchNomPokemon(nomOuId.toString());

        // 2. Info Espèce
        const species = await fetchGenericURL(pokemon.species.url);

        // 3. Info Chaîne d'évolution
        const evolutionChainData = await fetchGenericURL(species.evolution_chain.url);

        // --- TRAITEMENT DES ÉVOLUTIONS ---
        const evolutions: any[] = [];
        let currentEvo = evolutionChainData.chain;

        do {
            const evoDetails = currentEvo.species;
            const idPart = evoDetails.url.split('/');
            const id = idPart[idPart.length - 2];

            evolutions.push({
                name: evoDetails.name,
                id: id,
                image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
            });

            currentEvo = currentEvo.evolves_to[0];
        } while (currentEvo !== undefined && currentEvo.hasOwnProperty('species'));

        const evoHtml = evolutions.map(evo => `
            <div class="evo-card" onclick="document.dispatchEvent(new CustomEvent('nav-pokemon', {detail: '${evo.name}'}))">
                <img src="${evo.image}" alt="${evo.name}">
                <span>${evo.name}</span>
            </div>
        `).join('<div class="arrow">➜</div>');


        // --- RENDU FINAL ---
        const statsHtml = pokemon.stats.map((s: any) => `
            <div class="stat-row">
                <div>${s.stat.name.toUpperCase()} : </div>
                <div>${s.base_stat}</div>
            </div>
        `).join('');

        // --- CALCUL DES IDs PRÉCÉDENT / SUIVANT ---
        const currentId = pokemon.id;
        // Si on est au 1, on retourne au 1025, sinon on recule de 1
        const prevId = currentId > 1 ? currentId - 1 : 1025;
        // Si on est au 1025, on retourne au 1, sinon on avance de 1
        const nextId = currentId < 1025 ? currentId + 1 : 1;

        detail.innerHTML = `
            <li class="pokemon-card detail-view">
                <div class="detail-header">
                    <div class="pokemon-name">ID_${pokemon.id.toString().padStart(3, '0')} // ${pokemon.name}</div>
                </div>
                
                <div class="main-content">
                    <img class="main-img" src="${pokemon.sprites.other['official-artwork'].front_default}" />
                    
                    <div class="card-info">
                        <p>> TYPE: ${pokemon.types.map((t: any) => t.type.name).join(' / ')}</p>
                        <p>> HEIGHT: ${pokemon.height / 10}M | WEIGHT: ${pokemon.weight / 10}KG</p>
                        
                        <div class="stats-container">
                            ${statsHtml}
                        </div>

                        <div class="evolution-section">
                            <div class="evo-title"> CHAÎNE D'ÉVOLUTION</div>
                            <div class="evo-container">
                                ${evoHtml}
                            </div>
                        </div>

                        <button id="play-cry" class="cry-btn">🔊 Écouter le cri</button>
                        <button id="add-team-1" class="team-add-btn">Ajouter à l'équipe 1</button>
                        <button id="add-team-2" class="team-add-btn">Ajouter à l'équipe 2</button>
                        <button id="add-team-3" class="team-add-btn">Ajouter à l'équipe 3</button>
                        
                    </div>
                </div>

                <div class="navigation-footer">
                    <button id="btn-prev" class="pokemon-precedent"> < Précédent </button>
                    <button id="back-btn" class="back-btn">Retour liste</button>
                    <button id="btn-next" class="pokemon-suivant"> Suivant > </button>
                </div>
            </li>`;

        // --- GESTION DES ÉVÉNEMENTS ---

        // 1. Navigation évolution
        document.addEventListener('nav-pokemon', (e: any) => {
            afficherFicheDetaillee(e.detail);
        }); // Note: Attention aux memory leaks ici si on empile les listeners, mais acceptable pour ce projet simple.

        // 2. Bouton Retour
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if(liste) liste.style.display = "grid";
                if(detail) detail.style.display = "none";
                if(detail) detail.innerHTML = "";
                if(pagination) pagination.style.display = "flex";
            });
        }

        // 3. Bouton Cri
        const cryBtn = document.getElementById('play-cry');
        if (cryBtn) {
            cryBtn.addEventListener('click', () => {
                new Audio(pokemon.cries.latest).play();
            });
        }

        // 4. Navigation Précédent / Suivant
        const btnPrev = document.getElementById('btn-prev');
        const btnNext = document.getElementById('btn-next');

        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                afficherFicheDetaillee(prevId);
            });
        }

        if (btnNext) {
            btnNext.addEventListener('click', () => {
                afficherFicheDetaillee(nextId);
            });
        }
        [1, 2, 3].forEach(num => {
            const btnAjout = document.getElementById(`add-team-${num}`);
            if (btnAjout) {
                btnAjout.addEventListener('click', () => {
                    // On appelle la fonction qu'on a créée dans équipe.ts
                    ajouterPokemon(num, pokemon);
                });
            }
        });
    } catch (error) {
        detail.innerHTML = "<div class='error-box'>FATAL_ERROR: DATA_CORRUPT</div>";
        console.error(error);
    }
}