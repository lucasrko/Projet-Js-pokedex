
export interface MembreEquipe {
    id: number;
    nom: string;
    image: string;
}

// 1. AFFICHER LE BOUTON "MES ÉQUIPES" SUR L'ACCUEIL
export function CreateurEquipe() {
    const liste = document.querySelector<HTMLUListElement>('#pokemon-list');
    if (!liste) return;

    let teamContainer = document.querySelector<HTMLDivElement>('#pokemon-team-container');

    if (!teamContainer) {
        teamContainer = document.createElement('div');
        teamContainer.id = 'pokemon-team-container';
        // On le cache par défaut, on l'affichera quand on cliquera sur le bouton

        // Insertion du conteneur avant la liste
        if (liste.parentNode) {
            liste.parentNode.insertBefore(teamContainer, liste);
        }

        // Création du bouton principal
        const btnDiv = document.createElement('div');
        btnDiv.innerHTML = `<button id="btn-mes-equipes">GÉRER MES ÉQUIPES</button>`;
        // On insère ce bouton AVANT le container d'équipe pour qu'il reste toujours visible
        teamContainer.parentNode?.insertBefore(btnDiv, teamContainer);

        // Clic sur le bouton
        document.getElementById('btn-mes-equipes')?.addEventListener('click', () => {
            afficherPageEquipes();
        });
    }
}

// AFFICHER LA PAGE DE GESTION DES ÉQUIPES
export function afficherPageEquipes() {
    const liste = document.querySelector<HTMLUListElement>('#pokemon-list')!;
    const pagination = document.querySelector<HTMLDivElement>('.pagination-controls')!;
    const detail = document.querySelector<HTMLUListElement>('#pokemon-detail')!;
    const teamContainer = document.querySelector<HTMLDivElement>('#pokemon-team-container')!;
    const searchContainer = document.querySelector('.search-container') as HTMLElement;

    // A. Masquer les autres vues
    liste.style.display = "none";
    pagination.style.display = "none";
    detail.style.display = "none";
    if(searchContainer) searchContainer.style.display = "none";

    // Afficher le conteneur d'équipe
    teamContainer.style.display = "block";
    teamContainer.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h2 style="color:var(--cb-blue)">CENTRE DE GESTION D'ÉQUIPES</h2>
            <button id="close-team-btn" class="back-btn">RETOUR LISTE</button>
        </div>
        <div class="teams-wrapper">
            ${genererHtmlEquipe(1)}
            ${genererHtmlEquipe(2)}
            ${genererHtmlEquipe(3)}
        </div>
    `;

    // C. Gérer le bouton retour
    document.getElementById('close-team-btn')?.addEventListener('click', () => {
        teamContainer.style.display = "none";
        liste.style.display = "grid";
        pagination.style.display = "flex";
        if(searchContainer) searchContainer.style.display = "flex";
    });

    // D. Activer les boutons de suppression (les croix rouges)
    attacherEvenementsSuppression();
}

function genererHtmlEquipe(num: number): string {
    const data = localStorage.getItem(`team_${num}`);
    const equipe: MembreEquipe[] = data ? JSON.parse(data) : [];

    let membresHtml = '';

    if (equipe.length === 0) {
        membresHtml = '<div style="font-style:italic; color:#666;">Aucun Pokémon</div>';
    } else {
        membresHtml = equipe.map(pokemon => `
            <div class="team-member">
                <img src="${pokemon.image}" alt="${pokemon.nom}">
                <div class="member-info">
                    <strong>${pokemon.nom.toUpperCase()}</strong><br>
                    ID #${pokemon.id}
                </div>
                <button class="delete-btn" data-team="${num}" data-id="${pokemon.id}">X</button>
            </div>
        `).join('');
    }

    return `
        <div class="team-column">
            <div class="team-title">ÉQUIPE ${num} (${equipe.length}/6)</div>
            ${membresHtml}
        </div>
    `;
}

// 3. LOGIQUE DE SUPPRESSION
function attacherEvenementsSuppression() {
    const btns = document.querySelectorAll('.delete-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            // Récupérer les infos stockées dans les attributs data-team et data-id
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

        // On garde tous les pokémons SAUF celui qui a l'ID qu'on veut supprimer
        equipe = equipe.filter(pokemon => pokemon.id !== idPokemon);

        // On sauvegarde le nouveau tableau
        localStorage.setItem(cle, JSON.stringify(equipe));

        // On rafraîchit l'affichage pour voir le résultat tout de suite
        afficherPageEquipes();
    }
}

// 4. LOGIQUE D'AJOUT (Celle que tu avais déjà, inchangée)
export function ajouterPokemon(numeroEquipe: number, donneesPokemon: any) {
    const nouveauMembre: MembreEquipe = {
        id: donneesPokemon.id,
        nom: donneesPokemon.name,
        image: donneesPokemon.sprites.other['official-artwork'].front_default
    };

    const cleSauvegarde = "team_" + numeroEquipe;
    const dataTexte = localStorage.getItem(cleSauvegarde);
    let equipeActuelle: MembreEquipe[] = dataTexte ? JSON.parse(dataTexte) : [];

    if (equipeActuelle.some(p => p.id === nouveauMembre.id)) {
        alert(`${nouveauMembre.nom} est déjà dans l'équipe ${numeroEquipe} !`);
        return;
    }

    if (equipeActuelle.length >= 6) {
        alert(`L'équipe ${numeroEquipe} est complète !`);
        return;
    }

    equipeActuelle.push(nouveauMembre);
    localStorage.setItem(cleSauvegarde, JSON.stringify(equipeActuelle));

    // Petit bonus : demande confirmation visuelle
    if(confirm(`${nouveauMembre.nom} ajouté ! Voir mes équipes ?`)) {
        afficherPageEquipes();
    }
}
