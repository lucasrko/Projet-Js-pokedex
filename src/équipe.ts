


export function CreateurEquipe (){
    const pagination = document.querySelector<HTMLDivElement>('.pagination-controls')!;
    const detail = document.querySelector<HTMLUListElement>('#pokemon-detail')!;
    const liste = document.querySelector<HTMLUListElement>('#pokemon-list')!;

    pagination.style.display = "none";
    liste.style.display = "none";
    detail.style.display = "block";

    if (!liste) return;
    let team = document.querySelector<HTMLUListElement>('#pokemon-team')!;
    if (!team) {
        team = document.createElement('div');
        team.id = 'pokemon-team';
    }

    // 2. C'est ici que ça se joue :
    // On insère l'élément 'team' dans le parent de la liste, juste AVANT la liste.
    if (liste.parentNode) {
        liste.parentNode.insertBefore(team, liste);
    }
    team.innerHTML += `
                <button id="btn-mes-equipes">Mes équipes</button>
            `;

}
CreateurEquipe();