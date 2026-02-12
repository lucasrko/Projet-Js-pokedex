// pagination.ts
import {afficherFicheDetaillee} from  './detail.ts'
import {fetchListePokemon} from './api.ts'
import {rechercherUnPokemon} from "./recherche.ts";

export let currentPage = 1;

export async function getPokemonIndic(page: number, LIMIT=18) {
    currentPage = page; // Mise à jour de la page courante

    const prevBtn = document.querySelector<HTMLButtonElement>('#prev-btn');
    const pagination = document.querySelector<HTMLDivElement>('.pagination-controls')!;
    const liste = document.querySelector<HTMLUListElement>('#pokemon-list')!;
    const detail = document.querySelector<HTMLUListElement>('#pokemon-detail')!; // Sélecteur du détail

    if(liste) liste.style.display = "grid";
    if(detail) detail.style.display = "none";
    if(detail) detail.innerHTML = "";
    if(pagination) pagination.style.display = "flex";


    if (prevBtn) {
        prevBtn.disabled = (page === 1);
    }

    liste.innerHTML = "Chargement..."

    const offset = (page - 1) * LIMIT;
    const catalogue = await fetchListePokemon(offset, LIMIT);
    liste.innerHTML = "Chargement...";


    const totalPokemon = Math.min(catalogue.count, 1025);
    genererPagination(page, LIMIT, totalPokemon);

    const nextBtn = document.querySelector<HTMLButtonElement>('#next-btn');
    const maxPages = Math.ceil(totalPokemon / LIMIT);
    if (nextBtn) {
        nextBtn.disabled = (page >= maxPages);
    }

    liste.innerHTML = "";

    if (liste) {

        for (const p of catalogue.results) {
            const rep = await fetch(p.url);
            const pokemon = await rep.json();

            liste.innerHTML += `
                
                <li class="pokemon-card clickable-card" data-name="${pokemon.name}">
                    <div class="pokemon-name">${pokemon.name}</div>
                    <img src="${pokemon.sprites.other['official-artwork'].front_default}" alt="${pokemon.name}" />
                </li>
            `;
        }
        attacherEvenementsCartes();
    }
}

function genererPagination(page: number, LIMIT: number, totalPokemon: number) {
    const conteneur = document.querySelector<HTMLDivElement>('#pagination-numbers');
    if (!conteneur) return;

    conteneur.innerHTML= ``;
    const totalPages = Math.ceil(totalPokemon / LIMIT);
    const creeBtn = (numPage: number) => {
        const btn = document.createElement('button');
        btn.innerText = numPage.toString();
        btn.className = 'btn-primary';

        if (numPage === page) {
            btn.classList.add('active');
            btn.disabled = true;
        }
        btn.addEventListener('click', () => {
            getPokemonIndic(numPage);
        });
        conteneur.appendChild(btn);
    }
    creeBtn(1);
    if (page>3){
        const span = document.createElement('span');
        span.innerText = `...`;
        conteneur.appendChild(span);
    }
    let debut = Math.max(2, page -1);
    let fin = Math.min(totalPages -1, page +1)

    if (page === 1 )fin = Math.min(totalPages - 1,3);
    if (page === totalPages) debut = Math.max(2, totalPages - 2);

    for (let i = debut; i <= fin; i++) {
        creeBtn(i);
    }

    if (page < totalPages -2){
        const span = document.createElement('span');
        span.innerText = `...`;
        conteneur.appendChild(span);
    }

    if (totalPages > 1){
        creeBtn(totalPages);
    }
}

export function attacherEvenementsCartes() {
    const cartes = document.querySelectorAll('.clickable-card');
    cartes.forEach(carte => {
        carte.addEventListener('click', () => {
            const nom = carte.getAttribute('data-name');
            if (nom) afficherFicheDetaillee(nom);
        });
    });
}

export function retourListe() {
    document.querySelector('#prev-btn')?.addEventListener('click', () => {
        if (currentPage > 1) {
            getPokemonIndic(currentPage - 1); // Correction ici pour utiliser l'argument
        }
    });

    document.querySelector('#next-btn')?.addEventListener('click', () => {
        getPokemonIndic(currentPage + 1); // Correction ici
    });

    document.querySelector('#search-btn')?.addEventListener('click', () => {

        rechercherUnPokemon(0)
    });

    document.querySelector<HTMLInputElement>('#search-input')?.addEventListener('keypress', (e:KeyboardEvent) => {
        if (e.key === 'Enter') rechercherUnPokemon(0);
    });

    getPokemonIndic(currentPage);
}