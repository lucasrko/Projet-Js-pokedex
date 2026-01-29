import './style.css'
import { getPokemonIndic } from './pagination.ts'
import {  rechercherUnPokemon} from './recherche.ts'
import { CreateurEquipe } from './équipe.ts'; // Vérifie que l'import est là

let currentPage = 1;


// bouton précédent
document.querySelector('#prev-btn')?.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        getPokemonIndic(currentPage);
    }
});
//bouton suivant
document.querySelector('#next-btn')?.addEventListener('click', () => {
    currentPage++;
    getPokemonIndic(currentPage);
});
// Recherche (Clic bouton et Touche Entrée)
document.querySelector('#search-btn')?.addEventListener('click', rechercherUnPokemon);
document.querySelector<HTMLInputElement>('#search-input')?.addEventListener('keypress', (e:KeyboardEvent) => {
    if (e.key === 'Enter') rechercherUnPokemon();
});
// Premier chargement
getPokemonIndic(currentPage);
CreateurEquipe();