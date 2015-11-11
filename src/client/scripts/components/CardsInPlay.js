import CardPile from './CardPile';

export default ({piles}) => (
    <div className="cards-in-play">
        <div>Cartes en jeux</div>
        {
            piles.map((pile, index) => (
                <div className="cards-in-play__pile" key={index}>
                    <CardPile cards={pile} />
                </div>
            ))
        }
    </div>
);