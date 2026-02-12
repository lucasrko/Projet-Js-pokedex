import { fetchTypeDetail } from './api.ts';

export interface MembreEquipe {
    id: number;
    nom: string;
    image: string;
    types: { name: string, url: string }[]; // On garde l'URL pour fetcher direct
}

export function CreateurEquipe() {
    const liste = document.querySelector<HTMLUListElement>('#pokemon-list');
    if (!liste) return;

    let teamContainer = document.querySelector<HTMLDivElement>('#pokemon-team-container');

    if (!teamContainer) {
        teamContainer = document.createElement('div');
        teamContainer.id = 'pokemon-team-container';
        if (liste.parentNode) {
            liste.parentNode.insertBefore(teamContainer, liste);
        }

        const btnDiv = document.createElement('div');
        btnDiv.innerHTML = `<button id="btn-mes-equipes">GÉRER MES ÉQUIPES</button>`;
        teamContainer.parentNode?.insertBefore(btnDiv, teamContainer);

        document.getElementById('btn-mes-equipes')?.addEventListener('click', () => {
            afficherPageEquipes();
        });
    }
}

export function afficherPageEquipes() {
    const liste = document.querySelector<HTMLUListElement>('#pokemon-list')!;
    const pagination = document.querySelector<HTMLDivElement>('.pagination-controls')!;
    const detail = document.querySelector<HTMLUListElement>('#pokemon-detail')!;
    const teamContainer = document.querySelector<HTMLDivElement>('#pokemon-team-container')!;
    const searchContainer = document.querySelector('.search-container') as HTMLElement;

    liste.style.display = "none";
    pagination.style.display = "none";
    detail.style.display = "none";
    if (searchContainer) searchContainer.style.display = "none";

    teamContainer.style.display = "block";

    teamContainer.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h2 style="color:var(--cb-blue)">CENTRE DE GESTION D'ÉQUIPES</h2>
            <button id="close-team-btn" class="back-btn">RETOUR LISTE</button>
        </div>
        <div class="teams-wrapper">
            <div id="team-1-col" class="team-column"></div>
            <div id="team-2-col" class="team-column"></div>
            <div id="team-3-col" class="team-column"></div>
        </div>
    `;

    chargerEquipe(1);
    chargerEquipe(2);
    chargerEquipe(3);

    document.getElementById('close-team-btn')?.addEventListener('click', () => {
        teamContainer.style.display = "none";
        liste.style.display = "grid";
        pagination.style.display = "flex";
        if (searchContainer) searchContainer.style.display = "flex";
    });
}

async function chargerEquipe(num: number) {
    const col = document.getElementById(`team-${num}-col`);
    if (!col) return;

    const data = localStorage.getItem(`team_${num}`);
    const equipe: MembreEquipe[] = data ? JSON.parse(data) : [];

    // Générer la liste des membres
    let membresHtml = '';
    if (equipe.length === 0) {
        membresHtml = '<div style="font-style:italic; color:#666;">Aucun Pokémon</div>';
    } else {
        membresHtml = equipe.map(pokemon => {
            const typesSafe = pokemon.types ? pokemon.types.map(t => t.name).join('/') : '???';
            return `
            <div class="team-member">
                <img src="${pokemon.image}" alt="${pokemon.nom}">
                <div class="member-info">
                    <strong>${pokemon.nom.toUpperCase()}</strong><br>
                    <span style="font-size:0.7rem; color:var(--cb-yellow)">TYPE: ${typesSafe}</span>
                </div>
                <button class="delete-btn" data-team="${num}" data-id="${pokemon.id}">X</button>
            </div>
        `}).join('');
    }

    col.innerHTML = `
        <div class="team-title">ÉQUIPE ${num} (${equipe.length}/6)</div>
        ${membresHtml}
        <div id="analyse-team-${num}" class="analysis-box">
            ${equipe.length > 0 ? '<span class="loading-text">📡 Connexion PokeAPI... Analyse des types...</span>' : ''}
        </div>
    `;

    attacherEvenementsSuppression(col);

    if (equipe.length > 0) {
        await analyserFaiblessesViaAPI(equipe, num);
    }
}


// Liste des 18 types pour vérifier la couverture totale
const TOUS_LES_TYPES = [
    "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground",
    "flying", "psychic", "bug", "rock", "ghost", "dragon", "steel", "dark", "fairy"
];
// Analyse faiblesse
async function analyserFaiblessesViaAPI(equipe: MembreEquipe[], numTeam: number) {
    const container = document.getElementById(`analyse-team-${numTeam}`);
    if (!container) return;

    try {
        const typeUrlsUniques = new Set<string>();
        equipe.forEach(p => { if(p.types) p.types.forEach(t => typeUrlsUniques.add(t.url)); });

        const typeDataMap = new Map<string, any>();
        for (const url of typeUrlsUniques) {
            const data = await fetchTypeDetail(url);
            typeDataMap.set(data.name, data);
        }

        const faiblessesNonCouvertes: { type: string, score: number }[] = [];

        TOUS_LES_TYPES.forEach(typeAttaquant => {
            let scoreEquipe = 0;

            equipe.forEach(pokemon => {
                if (!pokemon.types) return;

                let multiplicateur = 1;

                pokemon.types.forEach(typeDefensif => {
                    const infoType = typeDataMap.get(typeDefensif.name);
                    if (infoType) {
                        // L'API nous dit ce qui est super efficace CONTRE ce type
                        if (infoType.damage_relations.double_damage_from.some((t: any) => t.name === typeAttaquant)) {
                            multiplicateur *= 2;
                        }
                        // L'API nous dit ce qui est peu efficace CONTRE ce type
                        if (infoType.damage_relations.half_damage_from.some((t: any) => t.name === typeAttaquant)) {
                            multiplicateur *= 0.5;
                        }
                        // L'API nous dit ce qui n'a aucun effet CONTRE ce type
                        if (infoType.damage_relations.no_damage_from.some((t: any) => t.name === typeAttaquant)) {
                            multiplicateur = 0;
                        }
                    }
                });

                // Application du système de points
                if (multiplicateur > 1) {
                    scoreEquipe -= 1;
                } else if (multiplicateur < 1) {
                    scoreEquipe += 1;
                }
            });

            if (scoreEquipe < 0) {
                faiblessesNonCouvertes.push({ type: typeAttaquant, score: scoreEquipe });
            }
        });


        if (faiblessesNonCouvertes.length === 0) {
            container.className = "analysis-box safe";
            container.innerHTML = "🛡️ Couverture Défensive Parfaite !";
        } else {
            // On trie pour afficher les plus grosses failles en premier
            faiblessesNonCouvertes.sort((a, b) => a.score - b.score);

            const htmlAlertes = faiblessesNonCouvertes.map(f => `
                <div class="weakness-row">
                    <span class="type-name type-${f.type}">${f.type.toUpperCase()}</span>
                    <span class="danger-level" style="color:#ff4d4d">Faiblesse non couverte (Score ${f.score})</span>
                </div>
            `).join('');

            container.className = "analysis-box danger";
            container.innerHTML = `
                <div class="analysis-title">FAILLES DÉFENSIVES</div>
                <div style="font-size:0.6rem; margin-bottom:5px; font-style:italic;">(Ajoutez des résistances pour compenser)</div>
                ${htmlAlertes}
            `;
        }

    } catch (e) {
        console.error(e);
        container.innerHTML = "<div style='color:red; font-size:0.7rem'>Erreur analyse</div>";
    }
}

function attacherEvenementsSuppression(context: HTMLElement) {
    const btns = context.querySelectorAll('.delete-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const numTeam = target.getAttribute('data-team');
            const idPokemon = target.getAttribute('data-id');

            if (numTeam && idPokemon) {
                retirerPokemon(parseInt(numTeam), parseInt(idPokemon));
            }
        });
    });
}

function retirerPokemon(numEquipe: number, idPokemon: number) {
    const cle = `team_${numEquipe}`;
    const data = localStorage.getItem(cle);

    if (data) {
        let equipe: MembreEquipe[] = JSON.parse(data);
        equipe = equipe.filter(pokemon => pokemon.id !== idPokemon);
        localStorage.setItem(cle, JSON.stringify(equipe));
        afficherPageEquipes(); // Rechargera la page et relancera l'analyse
    }
}

export function ajouterPokemon(numeroEquipe: number, donneesPokemon: any) {
    // On garde name + url pour pouvoir rappeler l'API plus tard
    const typesExtraits = donneesPokemon.types.map((t: any) => ({
        name: t.type.name,
        url: t.type.url
    }));

    const nouveauMembre: MembreEquipe = {
        id: donneesPokemon.id,
        nom: donneesPokemon.name,
        image: donneesPokemon.sprites.other['official-artwork'].front_default,
        types: typesExtraits
    };

    const cleSauvegarde = "team_" + numeroEquipe;
    const dataTexte = localStorage.getItem(cleSauvegarde);
    let equipeActuelle: MembreEquipe[] = dataTexte ? JSON.parse(dataTexte) : [];

    if (equipeActuelle.some(p => p.id === nouveauMembre.id)) {
        alert("Ce Pokémon est déjà dans l'équipe !");
        return;
    }

    if (equipeActuelle.length >= 6) {
        alert(`L'équipe ${numeroEquipe} est complète !`);
        return;
    }

    equipeActuelle.push(nouveauMembre);
    localStorage.setItem(cleSauvegarde, JSON.stringify(equipeActuelle));

    if(confirm(`${nouveauMembre.nom} ajouté ! Voir mes équipes ?`)) {
        afficherPageEquipes();
    }
}