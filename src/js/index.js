import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listview from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader} from './views/base';

/**Global state of the app
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
 */
const state = {};

const controlSearch = async() => {
    // 1) Get query from view
    const query = searchView.getInput();//TODO

    if(query){
        // 2) New search object and add to state
        state.search = new Search(query);

        // 3) Prepare UI for results
        searchView.clearResults();
        searchView.clearInput();
        renderLoader(elements.searchRes);
        try {
            // 4) Search for recipes
            await state.search.getResults();

            // 5) Render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);
        }catch(err){
            alert('Sometings wrong with the search');
        }
        

    }
};
elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if(btn){
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result,goToPage);
    }
})


/**
 * RECIPE CONTROLOR
 */
const controlRecipe = async() => {
    //Get ID from url
    const id = window.location.hash.replace('#','');

    if(id){
        //Prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //highlight selected search item
        if(state.search) searchView.highlightSelector(id);

        //Create new recipe object
        state.recipe = new Recipe(id);
        
        try{
            //Get recipe data
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();
        
            //Calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();
            
            //Render recipe
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
        }catch(error){
            alert('Error processing recipe!');
            console.log(error);
        }
    }
        
       
};


['hashchange','load'].forEach(event => window.addEventListener(event, controlRecipe));

/**
 * LIST CONTROLLER
 */
const controlList = () =>{
    if(!state.list) state.list = new List();
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listview.renderItem(item);
    });
};

/**
 * LIKE CONTROLLER
 */
//Test

const controlLike = () =>{
    if(!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;
    if(!state.likes.isLiked(currentID)){
        // Add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img,
        );
        // Toggle the like button
        likesView.toggleLikeBtn(true);

        // Add like to UI List
        likesView.renderLike(newLike);

    }else{
        // Remove like to the state
        state.likes.deleteLike(currentID);
        // Toggle the like button
        likesView.toggleLikeBtn(false);
        // Remove like to UI List
        likesView.deleteLike(currentID);

    }
    likesView.toggleLikeMenu(state.likes.getNumberLikes());
}

//Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    //Handle the delete button
    if(e.target.matches('.shopping__delete, .shopping__delete *')){
        state.list.deleteItem(id);
        listview.deleteItem(id)
        
    }else if(e.target.matches('.shopping__count-value')){
        const val = parseInt(e.target.value,10);
        state.list.updateCount(id,val);
    }
});

// Restore liked recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes();

    // Restore likes
    state.likes.readStorage();

    // Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumberLikes());
    // Render the likes to UI
    state.likes.likes.forEach(like => likesView.renderLike(like));
})

// Handing recipe button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')){
        // Decrease button is cliked
        if(state.recipe.servings > 1) state.recipe.updateServings('dec');
        recipeView.updateServingsIngredients(state.recipe);
    }else if(e.target.matches('.btn-increase, .btn-increase *')) {
        // Increase button is cliked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    }else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
        controlList();
    }else if (e.target.matches('.recipe__love, .recipe__love *')){
        controlLike();
    }
});
