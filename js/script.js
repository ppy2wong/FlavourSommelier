/*
HackerYou: Intro & Advanced JavaScript / jQuery
Session: Fall 2015
Name: Peggy Wong
Date: December 10, 2015
Project: Final Project
Project Name: Flavour Sommelier
--------------------------------------------------
Purpose: An app to find recipes for your next potluck or dinner party and pair them up with some very nice wines.  
Recipes are from Yummly API and wines are from LCBOAPI.
JavaScript concepts used: jQuery, plugins, Google Maps, Geolocation API, Charting API, Ajax API and Promises
New Concepts Learned: Gulp, SASS and FlexBox--I was very lucky to have taken HackerYou's AngularJS workshop in early 
November 2015, and got a glimpse of Gulp as used in the workshop.  I gave it a spin on my final project for the JavaScript
class, and I'll never look back.  Also, SASS has helped me build some modularized and structured CSS.  Finally,
I had a lot of fun with formatting elements using Flexbox - although I think I might benefit from watching some more
videos on the topic.
Challenges: I've written this app in JavaScript and jQuery.  
The majority of the application logic involves passing along information from one screen to another
within the app--I find that I've always had to attach results from one piece of functionality into the button
which will call the next piece of functionality, which causes the model logic and the GUI logic to be overly 
intertwined with one another, which makes the application difficult to maintain in the long run.
Possible improvements: I am planning to learn several JavaScript libraries and frameworks which will help decouple
the data models and UI views in a JavaScript app, such as Backbone.js, React.js and AngularJS.
*/

/* App namespace */
var app = {};

/* Initialize app parameters */
app.init = function() {
	/* App version metadata */
	app.metadata = {
		version: "1.0",
		maker: "Peggy Wong"
	};

	/* API service data and actual data for recipes */
	app.recipes = {
		endpoint: {
			endpointURL: "http://api.yummly.com/v1",
			endpointAPI: "/api",
			endpointMethod: "/recipes",
			applicationID: "1716a5dc",
			apiKey: "958744c46ac16e8c3082309f99002466"
		},
		data: {
			recipeArray: [],
			pages : 1,
			dishName : "",
			allergyList: [],
			dietList: []
		},
		resetPages: function() {
			app.recipes.data.recipeArray = [];
			app.recipes.data.pages = 1;
			app.recipes.data.allergyList = [];
			app.recipes.data.dietList = [];
		}
	};

	/* API service data and actual data for single recipe */
	app.singleRecipe = {
		endpoint: {
			endpointURL: "http://api.yummly.com/v1",
			endpointAPI: "/api",
			endpointMethod: "/recipe",
			applicationID: "1716a5dc",
			apiKey: "958744c46ac16e8c3082309f99002466"
		},
		data: {
			recipe: {}
		},
		resetRecipe: function() {
			app.singleRecipe.data.recipe = {};
		}
	};

	
	/* API service data and actual data for wine pairings */
	app.winePairings = {
		endpoint: {
			endpointURL: "https://lcboapi.com",
			endpointAPI: "",
			endpointMethod: "/products",
			apiKey: "MDpkODMzNWJkOC05MzlhLTExZTUtYjNhNi0yMzkwZWViZTRhNGQ6OHczcUFHZWhlMFVNZUhxdzhUaWk3enBKOFpnWnFZd3pxQ0Nj"
		},
		data: {
			winePairingArray: [],
			pages: 1
		},
		resetPages: function() {
			app.winePairings.data.winePairingArray = [];
			app.winePairings.data.pages = 1;
		}
	};

	/* API service data and actual data for LCBO locations */
	app.lcboLocations = {
		endpoint: {
			endpointURL: "https://lcboapi.com",
			endpointAPI: "",
			endpointMethod: "/stores",
			apiKey: "MDpkODMzNWJkOC05MzlhLTExZTUtYjNhNi0yMzkwZWViZTRhNGQ6OHczcUFHZWhlMFVNZUhxdzhUaWk3enBKOFpnWnFZd3pxQ0Nj"
		},
		data: {
			storeArray: [],
			pages: 1,
			map: {},
			locationMarkers: [],
			lastOpenedLocationMarker: {},
			allOpenedInfoWindows: []
		},
		resetPages: function() {
			app.lcboLocations.data.storeArray = [];
			app.lcboLocations.data.pages = 1;
			app.lcboLocations.data.map = {};
			app.lcboLocations.data.locationMarkers = [];
			app.lcboLocations.data.lastOpenedLocationMarker = {};
			app.lcboLocations.data.allOpenedInfoWindows = [];
		}
	};

	// Basic utility methods
	app.utilities = {
		// Compute intersection of two arrays
		intersectionArrays: function(array1, array2) {
			return array1.filter(function(value) {
				return array2.indexOf(value) !== -1;
			});
		},

		// Compute time (24-hours)
		// Source: https://lcboapi.com/docs/v1/stores#many
		msmTo24time: function(msm) {
		  var hour = msm / 60;
		  var mins = msm % 60;

		  return [hour, mins];
		},

		// Compute time (12 hours)
		// Source: https://lcboapi.com/docs/v1/stores#many
		msmTo12time: function(msm) {
		  var time = app.utilities.msmTo24time(msm);
		  var h24  = time[0];
		  var h12  = (0 == h24 ? 12 : (h24 > 12 ? (h24 - 10) - 2 : h24));
		  var ampm = (h24 >= 12 ? 'PM' : 'AM');

		  return [h12, time[1], ampm];
		},

		// Format time to string
		formatTimeToString: function(time) {
			if(time !== null) {
				var time12Hours = app.utilities.msmTo12time(time);
				var hour = Math.floor(time12Hours[0]);
				var minute = (time12Hours[1] < 10) ? "0" + time12Hours[1] : time12Hours[1];
				var ampm = time12Hours[2];

				return hour + ":" + minute + " " + ampm;
			} else {
				return "";
			}
 		}

	};


	// Methods for computing tasting notes 
	app.taster = {
		// List of wine pairings, mapped to flavour profiles returned from Yummly API.
		// Wine pairing mappings: http://www.wineandleisure.com/foodpairing2.html
		// Flavour definitions: https://developer.yummly.com/documentation#Recipe - from flavors array
		pairings: {
			reds: {
				"Sweet" : ["cabernet franc"],
				"Piquant" : ["pinot noir", "merlot", "gamay noir", "cabernet franc"],
				"Sour" : ["pinot noir", "merlot", "cabernet franc"],
				"Salty" : ["pinot noir", "gamay noir", "cabernet franc"],
				"Meaty" : ["shiraz", "merlot"],
				"Bitter" :  ["pinot noir", "gamay noir", "cabernet franc"]
			},
			whites: {
				"Sweet" : ["riesling"],
				"Piquant" : ["riesling", "vidal", "rose"],
				"Sour" : ["riesling", "pinot grigio", "chardonnay"],
				"Salty" : ["riesling", "rose"],
				"Meaty" : ["riesling", "viognier"],
				"Bitter" :  ["pinot grigio"]
			},
			dessertWines : [ 'vidal', 'ice wine', 'dessert wine', 'moscato']

		},

		// Check if a dish is red meat.
		isRedMeat: function(dish) {
			
			// Fixed list of red meats
			var redMeatTypes = ["Steak", "Veal", "Lamb", "Venison", "Beef"];

			// If the dish in questions contains any of the above red meats, then it's a red meat
			return redMeatTypes.some(function(redMeatDish, index, array) {
				return dish.name.toLowerCase().indexOf(redMeatDish.toLowerCase() ) !== -1;
			});
		},

		// Check if a dish is a dessert
		isDessert: function(dish) {

			if(dish.attributes.course) {
				return dish.attributes.course.indexOf("Desserts") !== -1;
			}else {
				return false;
			}
		},

		/* Find wine pairings based on dish profile and other parameters.
		http://www.wineandleisure.com/foodpairing2.html */

		/* Get wine pairings (from LCBO).
		TODO: Get list of recommendations based on varietals, not based on single keyword (challenging) */
		pairDishWithWine: function(dish) {

			// Pseudocode:
			// 1) Find dominant flavour of dish.
			// 2) Map dominant flavour of dish to a fixed type of wine
			// 3) Return fixed wine type as keyword to search in LCBO API

			var dominantFlavour = "";
			var dominantFlavourIndex = 0;
			var startedComputation = false;
			var result = [];

			var logText = "";

			// Pair red wines with reds and white wines as whites

			var dishIsRedMeat = app.taster.isRedMeat(dish);
			var dishIsDessert = app.taster.isDessert(dish);
			var pairingToUse = dishIsRedMeat ?
				app.taster.pairings.reds : app.taster.pairings.whites;

			// If the dish is a dessert, look for dessert wines!
			if(dishIsDessert) {
				result = app.taster.pairings.dessertWines;
			}
		    else {
				// Loop through the flavour profile
				for(flavour in dish.flavors) {

					// For any strong flavours in the dish (i.e. Yummly flavour score is greater than 0.7),
					// compute the intersection of wine pairings for the flavours.
					if(dish.flavors[flavour] > 0.7) {
						pairingForFlavour = pairingToUse[flavour];
						if(!startedComputation) {
							result = pairingForFlavour;
							startedComputation = true;
						} else {
							result = app.utilities.intersectionArrays(result, pairingForFlavour);
						}
					}

					// Find the most dominant flavour in the dish.
					if(dish.flavors[flavour] > dominantFlavourIndex) {
						dominantFlavourIndex = dish.flavors[flavour];
						dominantFlavour = flavour;
					}
				}

				// If no particular strong flavours are found in the dish (i.e. no flavours have a score of above 0.7)...
				if(result.length === 0) {
					if(!dominantFlavour) {
						// ...if we cannot find the most dominant flavour in the dish,
						// match the dish with a red wine if it's red meat, 
						// white wine otherwise.
						result = dishIsRedMeat ? ["red wine"] : ["white wine"];
					} else {
						// ...if we can find the most dominant flavour in the dish,
						// match the dish with the pairings for the dominant flavour. 
						result = pairingToUse[dominantFlavour];
					}
				} 

			}

			return result;
		}
	}



};

/* Get recipe information (from Yummly) and place it into the page */
app.getRecipes = function(freshSearch) {

	// Get the basic elements of the document
	var $dishName = $("#dishName");				// Dish name field
	var $listings = $("#recipeListings");		// Recipe search results list
	var $loader = $("#loader")					// Search results loading icon

	// Clear the search results if we're making a new search
	// (as opposed to adding more to the search results)
	if(freshSearch) {	
		$listings.empty();
		app.recipes.resetPages();
		app.recipes.data.dishName = $("#dishName").val();
	}

	// Get all allergies that the user has checked.
	var $checkedAllergies = $( "input[name='allergyList']:checked" );
	console.log($checkedAllergies);
	$checkedAllergies.each(function(){
    		app.recipes.data.allergyList.push($(this).val());
	});

	// Get all diets that the user has checked
	var $checkedDiets = $( "input[name='dietList']:checked" );
	console.log($checkedDiets);
	$checkedDiets.each(function(){
    		//do stuff here with this
    		console.log($(this).val());
    		app.recipes.data.dietList.push($(this).val());
	});

	// Stop the search if the user hasn't entered a dish name
	if(app.recipes.data.dishName === "") {
		return;
	}

	// Set up the AJAX call to Yummly to search for a list of recipes
	// with the provided dish name and the provided allergy list/diet list.
	var yapromise = $.ajax(
	  {
		  url : app.recipes.endpoint.endpointURL +
		  	app.recipes.endpoint.endpointAPI +
		  	app.recipes.endpoint.endpointMethod,
		  data : {
		  	// query settings
		  	"q" : app.recipes.data.dishName,

		  	// allergies and diets - the search parameters need to be
		  	// entered as an array
			"allowedAllergy[]": app.recipes.data.allergyList,
			"allowedDiet[]": app.recipes.data.dietList,

		  	// app key settings
		  	"_app_id" : app.recipes.endpoint.applicationID,
		  	"_app_key" : app.recipes.endpoint.apiKey,

		  	// pagination settings
		  	"maxResult" : 10,
		  	"start" : (app.recipes.data.pages - 1) * 10
		  },
		  type: 'GET',
		  dataType : 'jsonp',

		  // Show the loading icon when fetching search results.
		  beforeSend: function(){
		          $loader.show();
		  }
	   }
	);

	// Recipe result fetch is successful.  Populate recipe search results
	// with recipe cards.
	$.when(yapromise).done(function(response) {

	  // Hide the loading icon.
	  $loader.hide();

	  // Save the fetched search results.
	  app.recipes.data.recipeArray = response.matches;

	  // Create the "More recipes" button, to enable searching for more recipe results.
	  var $morePagesButton;
	  var $morePagesButtonPanel;
	  var $morePagesRow;
	  var $attributionRow;

	  if(freshSearch) {
		   $morePagesButton = 
			  	$("<button>")
			  	.attr("id", "moreRecipes")
			  	.text("More recipes");
		   $morePagesButtonPanel =
				$("<div>")
				.addClass("buttons");
		   $morePagesRow =
				$("<div>")
				.attr("id", "moreRecipesContainer")
				.addClass("contentWrap");
			$morePagesButtonPanel.append($morePagesButton);
			$morePagesRow.append($morePagesButtonPanel);
			$listings.append($morePagesRow);
			$attributionRow =
				$("<div>")
				.attr("id", "attributionContainer")
				.addClass("contentWrap")
				.html(response.attribution.html);
			$listings.append($attributionRow);
	 }

	 var $morePagesRowAfterCreation = $("#moreRecipesContainer");

      // Build a recipe card for each search results
	  app.recipes.data.recipeArray.forEach(
	  	function(recipe, index, array) {

	  		// Recipe name
	  		var $recipeName = $("<h1>").text(recipe.recipeName);

	  		// Recipe image
	  		var $image = $("<div>")
	  			  	.addClass("image")
	  			  	.append(
	  			  		$("<img>").attr("src", recipe.smallImageUrls[0])
	  			  	);

	  		// Recipe description - including preparation time in minutes,
	  		// ingredients and source name
	  		var $description = $("<div>")
	  			.addClass("description")
	  			.append(
	  				$("<p>").html("<strong>Prep Time in Minutes: </strong>" + (recipe.totalTimeInSeconds / 60) )
	  			)
	  			.append(
	  				$("<p>")
	  					.append($("<strong>").text("Ingredients: "))
	  					.append( recipe.ingredients.join(", ") )
	  			)
	  			.append(
	  				$("<p>").html("<strong>Source: </strong>" + recipe.sourceDisplayName )
	  			)

	  		// Build recipe detail information
	  		var $recipeDetailsWrap = $("<div>")
	  			.addClass("recipeDetailsWrap")
	  			.append($image)
	  			.append($description);
	  			
	  		// Build button to get more details about the recipe.
	  		// Be sure to save the recipe ID as a data- attribute so that it can make the call to the Yummly API
	  		// to search for an individual recipe by ID.
	  		//
	  		// NOTE: Using data- attributes to pass data items into the next step of the application
	  		// is not a best practice, because it tightly couples model and UI elements.
	  		// It is best to use libraries like Backbone.js / React.js, or AngularJS.
	  		var $button = $("<div>")
	  			.addClass("buttonWrap")
	  			.append(
	  				$("<button>")
	  					.addClass("recipeButton")
	  					.text("See detailed recipe")
	  					.data("recipe-id", recipe.id)
	  			);
 
 			// Build an entire item wrapper.
	  		var $itemWrap = $("<div>")
	  			.addClass("itemWrap")
	  			.append($recipeName)
	  			.append($recipeDetailsWrap)
	  			.append($button);

	  		// Build the outside item wrapper
	  		var $item = $("<div>")
	  			.addClass("item")
	  			.addClass("contentWrap")
	  			.append($itemWrap);
	  		
	  		// Add the item to after the More Recipes button.
	  		$item.insertAfter($morePagesRowAfterCreation);


	  	}
	  );

	  // advance page count
	  app.recipes.data.pages++;

	}
	).fail(function(error) {

		// Display error message if recipes cannot be found.
		$listings.append(
			$("<div>")
				.addClass("errorContentWrap")
				.append(
					$("<p>").text("Cannot find recipes - please try again later.")
				)
		);

		// Hide the loading icon.
		$loader.hide();

	  console.log("Error!");
	  console.log(error);
	});
};

/* Get a single recipe by its recipe ID */ 
app.getSingleRecipe = function(recipeId) {
	
	// Get the basic elements of the document
	var $singleRecipe = $("#recipe");						// Recipe panel
	var $loader = $(".overlay .overlayContent #loader");	// Loading icon for the app overlay

	// Clear existing contents of recipe panel.
	$singleRecipe.empty();

	var yapromise = $.ajax(
	  {
		  url : app.singleRecipe.endpoint.endpointURL +
		  	app.singleRecipe.endpoint.endpointAPI +
		  	app.singleRecipe.endpoint.endpointMethod +
		  	"/" + recipeId,
		  data : {

		  	// app key settings
		  	"_app_id" : app.singleRecipe.endpoint.applicationID,
		  	"_app_key" : app.singleRecipe.endpoint.apiKey,
		  },
		  type: 'GET',
		  dataType : 'jsonp',
		  // Show the loading button when fetching recipe details
		  beforeSend: function(){
		          $loader.show();
		  }
	   }
	);

	// Recipe details succesfully fetched.
	$.when(yapromise).done(function(response) {

	  // Hide loading button
	  $loader.hide();

	  // Save recipe detail response
	  app.singleRecipe.data.recipe = response;


	  /* Find flavour profile information from recipe detail response */
	  var winePairingKeywords = app.taster.pairDishWithWine(
	  		app.singleRecipe.data.recipe
	  	);


	  // Build headers
	  var $h1 = $("<h1>").append(app.singleRecipe.data.recipe.name);		// recipe name
	  var $h2 = $("<h2>").html(app.singleRecipe.data.recipe.attribution.html); // Yummly attribution

	  // Recipe image
	  var $image = $("<div>")
	  	  	.addClass("image")
	  	  	.append(
	  	  		$("<img>").attr("src", app.singleRecipe.data.recipe.images[0].hostedLargeUrl)
	  	  	);
	  	  	
	  // Recipe description - includes ingredients, number of servings, preparation time in minutes,
	  // flavours, rating, recipe source and link to recipe
	  var $description = $("<div>")
	  	.addClass("description")
	  	.append(
	  		$("<p>")
	  			.append("<strong>Ingredients: </strong>")
	  			.append( $("<ul>")
	  			.html( "<li>" + app.singleRecipe.data.recipe.ingredientLines.join("</li><li>") + "</li>") )
	  	)
	  	.append(
	  		$("<p>").html("<strong>Number of servings: </strong>" + (app.singleRecipe.data.recipe.numberOfServings) )
	  	)
	  	.append(
	  		$("<p>").html("<strong>Prep Time in Minutes: </strong>" + (app.singleRecipe.data.recipe.totalTime) )
	  	)
	  	.append(
	  		$("<p>").html("<strong>Flavours: </strong>").addClass("flavourMarker")
	  	)
	  	.append(
	  		$("<p>").html("<strong>Rating: </strong>" + app.singleRecipe.data.recipe.rating )
	  	)
	  	.append(
	  		$("<p>")
	  		.append(
	  			$("<strong>").text("Recipe courtesy of: ")
	  			.append(
	  				$("<a>")
	  				.attr("href", "http://" + app.singleRecipe.data.recipe.source.sourceSiteUrl)
	  				.attr("target", "_blank")
	  				.text(app.singleRecipe.data.recipe.source.sourceDisplayName)
	  			)
	  		)
	  	)
	  	.append(
	  		$("<p>")
	  		.append(
	  			$("<a>")
	  			.attr("href", app.singleRecipe.data.recipe.source.sourceRecipeUrl)
	  			.attr("target", "_blank")
	  			.text("View Recipe")
	  		)
	  	);


  	// Build button to get recommended wine pairings, from the recommended wine pairing types
  	// found for the recipe.
  	// Be sure to save the wine pairing types as a data- attribute so that it can make the call to the 
  	// LCBO API to search for the wines.
  	//
  	// NOTE: Using data- attributes to pass data items into the next step of the application
  	// is not a best practice, because it tightly couples model and UI elements.
  	// It is best to use libraries like Backbone.js / React.js, or AngularJS.
	 var $button = $("<div>")
	 	.addClass("buttonWrap")
	 	.append(
	 		$("<button>")
	 			.addClass("findPairings")
	 			.data("dish-name", app.singleRecipe.data.recipe.name)
	 			.data("wine-pairing-keywords", winePairingKeywords)
	 			.text("Get wine pairings")
	 			.data("recipe-id", recipe.id)
	 	);

	 // Build recipe details display
	 $singleRecipe.append($h1);
	 $singleRecipe.append($h2);
	 $singleRecipe.append($image);
	 $singleRecipe.append($description);
	 $singleRecipe.append($button);

     // Build a radar chart using ChartJS for the flavours, if flavours are available
	 var $flavourMarker = $("p.flavourMarker");
	 if(!( $.isEmptyObject ( app.singleRecipe.data.recipe.flavors ) ) ) {

	 	// Insert into correct spot.
	 	var $flavourChart = $("<canvas>").addClass("flavourChart");
	 	$flavourChart.insertAfter($flavourMarker);

		 // Populate the flavour chart
		 // first we select the canvas element
		 // we grab the first one with [0] because we will be calling native javascript methods on it
		 var canvas = $('.flavourChart')[0];

		 // then we grab the context - 2d
		 var ctx = canvas.getContext('2d');

		 // Set canvas size; should work for both responsive or conventional resolution
		 ctx.canvas.width = 200;
		 ctx.canvas.height = 200;

		 // Specify the Data to be used by the chart:
		 var flavours = [];
		 var flavourValues = [];

		 // Save the flavour names and flavour values.
		 for (flavour in app.singleRecipe.data.recipe.flavors) {
		 	flavours.push(flavour);
		 	flavourValues.push(app.singleRecipe.data.recipe.flavors[flavour]);
		 }

		 // Set up radar chart data
		 var data = {
		     labels: flavours,
		     datasets: [
		         {
		             label: "Flavour Profile for " + app.singleRecipe.data.recipe.name,
		             fillColor: "rgba(245,222,179,0.2)",
		             strokeColor: "rgba(245,222,179,1)",
		             pointColor: "rgba(245,222,179,1)",
		             pointStrokeColor: "#fff",
		             pointHighlightFill: "#fff",
		             pointHighlightStroke: "rgba(245,222,179,1)",
		             data: flavourValues
		         }
		     ]
		 };

		 // create an options object
		 // for now we leave it blank but we can put any options: http://www.chartjs.org/docs/#getting-started-global-chart-configuration
		 var options = {
		 	showScale: true,
		 	responsive: true
		 };

		 // Finally we kick the chart off

		 // we pass it the context, data and options
		 var myLineChart = new Chart(ctx).Radar(data, options);

	} else {
		// No flavour information found - display a message to indicate the flavour information isn't available
		$("<div>")
			.append("No flavour information found")
			.insertAfter($flavourMarker);
	}


	}).fail(function(error) {

		// Display error message if recipe details cannot be found.
		$singleRecipe.empty();
		$singleRecipe.append(
			$("<div>")
				.addClass("errorContentWrap")
				.append(
					$("<p>").text("Cannot find recipe details - please try again later.")
				)
		);
		// Hide loading icons.
		$loader.hide();

	   console.log("Failure");
	   console.log(error);
	});

};

/* Get wine pairings (from LCBO) given a dish name and a list of suggested wine pairings. */
app.getWinePairings = function(dishName, pairings) {

	// Get the basic elements of the document
	var $listings = $("#winePairings");						// Wine pairings panel
	var $loader = $(".overlay .overlayContent #loader");	// Loading icon for app overlay
	var $h1 = $("<h1>").text("Recommended Wine Pairings");	// Level 1 header - recommended wine pairings
	var $h2 = $("<h2>").text(dishName);						// Level 2 header - dish name
	var $pairings = $("<div>").addClass("listOfPairings");	// List of pairings

	// Erase existing information from wine pairings panel and reset number of pages
	$listings.empty();
	app.winePairings.resetPages();


	// Build list of pairings
	pairings.forEach(function(pairing, index, array) {
		$pairings.append(
			$("<span>").addClass("pairingItem").text(pairing)
		);
	});

	// Build headers
	$listings.append($h1);
	$listings.append($h2);
	/*$listings.append($pairings);*/


	// For each suggested wine pairing, make a query to the LCBO API to search for wines
	// fitting the pairing.
	// This will involve using an array of promises.
	var promises = [];
	pairings.forEach(function(pairing, index, array) {

		var promiseForPairing = $.ajax({
	  
		  url : app.winePairings.endpoint.endpointURL +
		  	app.winePairings.endpoint.endpointAPI +
		  	app.winePairings.endpoint.endpointMethod,
		  data : {
		  	// query info 
		  	"q" : pairing,

		  	// API key info
		  	"access_key" : app.winePairings.endpoint.apiKey,

		  	// pagination info
		  	"per_page" : 10,
		  	"page" : app.winePairings.data.pages,

		  	// eliminate any products that are discontinued or removed
		  	"where_not" : "is_dead"
		  },
		  type: 'GET',
		  dataType : 'jsonp',
		  // Show the loading icon when fetching pairings. 
		  beforeSend: function(){
		          $loader.show();
		  }
		});

		promises.push(promiseForPairing);
	});

	// Wine pairings succesfully fetched.
	$.when.apply($, promises).done(function() {


		$loader.hide();								// Hide loading icon
		$listings.append($h1).append($h2);			// Build headers

		// Prepare slides for wine selections based on the wine pairings
		var $flexSlider = $("<div>").addClass("flexslider");
		var $slides = $("<ul>").addClass("slides");

		// Handle the responses from the promises for each pairing.
		// If there's only one response, handle differently.
		var responses = arguments;
		var onlyOneResponse = false;

		for (i in responses) {

			  // value in responses array containing the actual results from LCBO
			  // is different depending on whether there's only one response or more than one response
			  var response = responses[i];
			  if(Array.isArray(response)) {
			  	// multiple responses
			  	app.winePairings.data.winePairingArray = responses[i][0].result;
			  } else {
			  	// one response only
			  	app.winePairings.data.winePairingArray = response.result;
			  	onlyOneResponse = true;
			  }

			  // For each wine product found in the search... 
			  app.winePairings.data.winePairingArray.forEach(
			  	function(wine, index, array) {

			  		// Wine summary
			  		var $summary = $("<div>")
			  			.addClass("summary");

			  		// Wine image
			  		 var $image = $("<img>")
			  		 	.attr("src", wine.image_url);
			  		 	  	
			  		// Wine description (includes wine name and price)
			  		 var $description = $("<p>")
			  		 			.addClass("description")
			  		 			.append(wine.name)
			  		 			.append(
			  		 				$("<p>").html(
			  		 					"<strong>" + "$" + (wine.price_in_cents / 100).toFixed(2) + "</strong>"
			  		 					)
			  		 			);

			  		 // Wine details (including producer name, origin, varietal, primary category,
			  		 // secondary category, style, tasting notes)
			  		 var $details = $("<div>")
			  		 	.addClass("details")
			  		 	.append(
			  		 		$("<p>").html("<em>Producer Name: </em>" + (wine.producer_name) )
			  		 	)
			  		 	.append(
			  		 		$("<p>").html("<em>Region: </em>" + 
			  		 			(wine.origin === null ? "Not available" : wine.origin) )
			  		 	)
			  		 	.append(
			  		 		$("<p>").html("<em>Varietal: </em>" + 
			  		 			(wine.varietal === null ? "Not available" : wine.varietal) )
			  		 	)
			  			.append(
			  				$("<p>").html("<em>Primary Category: </em>" + 
			  					(wine.primary_category === null ? "Not available" : wine.primary_category) )
			  			)
			  			.append(
			  				$("<p>").html("<em>Secondary Category: </em>" + 
			  					(wine.secondary_category === null ? "Not available" : wine.secondary_category) )
			  			)
			  			.append(
			  				$("<p>").html("<em>Style: </em>" + 
			  					(wine.style === null ? "Not available" : wine.style) )
			  			)
			  			.append(
			  				$("<p>").html("<em>Tasting Notes: </em>" + 
			  					(wine.tasting_note === null ? "Not available" : wine.tasting_note) )
			  			);

			  			// Build button to get nearest LCBO locations that store the wine.
			  			// Be sure to save the wine's product name and product ID as data- attributes so that it can make the call to the LCBO API to search for stores stocking the wine.
			  			//
			  			// NOTE: Using data- attributes to pass data items into the next step of the application
			  			// is not a best practice, because it tightly couples model and UI elements.
			  			// It is best to use libraries like Backbone.js / React.js, or AngularJS.
			  		 var $button = $("<div>")
			  		 	.addClass("buttonWrap")
			  		 	.append(
			  		 		$("<button>")
			  		 			.addClass("findLocation")
			  		 			.text("Find in stores")
			  		 			.data("lcbo-product-name", wine.name)
			  		 			.data("lcbo-product-id", wine.id)
			  		 	);


			  		// Build up the wine pairing information
					var $winePairingInfo = $("<li>")
						.addClass("winePairingInfo");

			  		$summary.append($image);
			  		$summary.append($description);
			  		$winePairingInfo.append($summary);
			  		$winePairingInfo.append($details);
			  		$winePairingInfo.append($button);

			  		// Add wine pairing information to slides
			  		$slides.append($winePairingInfo);

			  		console.log(wine);
			  	});

			 // Add slides to FlexSlider
			 $flexSlider.append($slides);

			 if(onlyOneResponse) {
			 	break;
			 }

		}

		 // Initialize flexslider
		 $flexSlider.flexslider({
	    	animation: "fade",
	    	animationSpeed: 1500,
	    	slideshow: false
	  	});

		 // Add the flexslider to the wine pairings panel
		 $listings.append($flexSlider);


	}).fail(function(error) {

		// Display error message if recipes cannot be found.
		$listings.append(
			$("<div>")
				.addClass("errorContentWrap")
				.append(
					$("<p>").text("Cannot find wine pairings - please try again later.")
				)
		);

		// Hide the loading icon.
		$loader.hide();

	  console.log("Error!");
	  console.log(error);
	});

};

/* Get a list of the 10 nearest LCBO locations that stock a specific product (by LCBO Product ID) */
app.getLocationsWithProduct = function(productName, productId) {


	var currentLatitude;		// Current latitude
	var currentLongitude;		// Current longitude

	// Get the basic elements of the document
	var $listings = $("#whereToBuy");			// Location List panel

	// Erase existing elements from Location List panel and reset pages.
	$listings.empty();
	app.lcboLocations.resetPages();


	// Activate the Geolocation API...
	navigator.geolocation.getCurrentPosition(function(position) {

		  // ...to get the user's current GPS location.
	      currentLatitude = position.coords.latitude;
	      currentLongitude = position.coords.longitude;

	      // Location List panel headers
	      var $h1 = $("<h1>").text("Closest stores to your current location");
	      var $h2 = $("<h2>").text(productName);

	      // Location List navigation
	      var $locationList = $("<div>").addClass("locationList");

	      // Div to store the map of locations
	      var $map = $("<div>").addClass("locationMap");

	      // Loading icon
	      var $loader = $(".overlay .overlayContent #loader");

	      // Build headers, Location List navigation, and location map
	      $listings.append($h1);
	      $listings.append($h2);
	      $listings.append($locationList);
	      $listings.append($map);

	      // Build the location map

	      // Default map options
	      var mapOptions = {
	        center: {lat: 43.7, lng: -79.4},
	        zoom: 15,
	        draggable: true
	      };

	      // We also select the map div with jquery, but only the first item in the array...
	      var mapDiv = $("div.locationMap")[0];
	      // ...which we then pass to the map method and store 
	      app.lcboLocations.data.map = new google.maps.Map(mapDiv, mapOptions);
	      // Define array bounds
	      var bounds = new google.maps.LatLngBounds();

	      // Search LCBO API for location information
	      var yapromise = $.ajax({
	        
	        url : app.lcboLocations.endpoint.endpointURL +
	        	app.lcboLocations.endpoint.endpointAPI +
	        	app.lcboLocations.endpoint.endpointMethod,
	        data : {
	        	// query info 
	        	// TODO: Change based on wine pairing matrix logic
	        	"product_id" : productId,
	        	"lat" : currentLatitude,
	        	"lon" : currentLongitude,

	        	// API key info
	        	"access_key" : app.lcboLocations.endpoint.apiKey,

	        	// pagination info
	        	"per_page" : 10,		// Get the 10 nearest stores
	        	"page" : app.lcboLocations.data.pages,

	        	// eliminate any stores that are closed
	        	"where_not" : "is_dead",

	        	// Show the loading icon when fetching nearest stores. 
	        	beforeSend: function(){
	        	        $loader.show();
	        	}
	        },
	        type: 'GET',
	        dataType : 'jsonp'
	      });

	      // Successfully fetched the 10 closest locations that stock the
	      // given wine
	      $.when(yapromise).done(function(response) {
	      	$loader.hide();											// Hide loading icon
	        app.lcboLocations.data.storeArray = response.result;	// Save of list of closest 10 locations

	        // For each location...
	        app.lcboLocations.data.storeArray.forEach(
	        	function(store, index, array) {


	        		// Create a Google Maps marker
	        		var storeLatLng = new google.maps.LatLng(store.latitude, store.longitude)
	        		var storeLatLngArray = [store.latitude, store.longitude];
	        		var marker = new google.maps.Marker({
	        		  position: storeLatLng,
	        		  map: app.lcboLocations.data.map, 
	        		  id: store.id
	        		});
	        		// Add the marker
	        		app.lcboLocations.data.locationMarkers.push(marker);

	        		// Add a Google Maps infowindow to the marker will will appear when the user clicks
	        		// on it (or when user clicks on the corresponding Location Info box to trigger the click event)
	        		google.maps.event.addListener(marker, "click", function() {
	        		  // Store name
	        		  var name = "<strong class=\"mapMarker\">" + store.name + "</strong><br>";

	        		  // Store address, city, telephone, hours
	        		  var description = 
	        		  	store.address_line_1 + "<br>"
	        		  	+ store.city + "<br>"
	        		  	+ store.telephone + "<br>"
	        		  	+ "<em>Hours</em>" + "<br>"
	        		  	+ "Sunday: " + app.utilities.formatTimeToString(store.sunday_open) + " - " + app.utilities.formatTimeToString(store.sunday_close) + "<br>"
	        		  	+ "Monday: " + app.utilities.formatTimeToString(store.monday_open) + " - " + app.utilities.formatTimeToString(store.monday_close) + "<br>"
	        		  	+ "Tuesday: " + app.utilities.formatTimeToString(store.tuesday_open) + " - " + app.utilities.formatTimeToString(store.tuesday_close) + "<br>"
	        		  	+ "Wednesday: " + app.utilities.formatTimeToString(store.wednesday_open) + " - " + app.utilities.formatTimeToString(store.wednesday_close) + "<br>"
	        		  	+ "Thursday: " + app.utilities.formatTimeToString(store.thursday_open) + " - " + app.utilities.formatTimeToString(store.thursday_close) + "<br>"
	        		  	+ "Friday: " + app.utilities.formatTimeToString(store.friday_open) + " - " + app.utilities.formatTimeToString(store.friday_close) + "<br>"
	        		  	+ "Saturday: " + app.utilities.formatTimeToString(store.saturday_open) + " - " + app.utilities.formatTimeToString(store.saturday_close) + "<br>";

	        		  // Build and open the Google Maps infowindow
	        		  var infoWindowContents = name + description;
	        		  var infoWindow = new google.maps.InfoWindow({
	        		                          content: infoWindowContents
	        		                  });
	        		  infoWindow.open(app.lcboLocations.data.map, marker);

	        		  // Keep track of open info windows
	        		  app.lcboLocations.data.allOpenedInfoWindows.push(infoWindow);
	        		});

					// Extend map bounds to the store's latitude/longitude
					// (want the displayed maps to encompass all 10 stores)
	        		bounds.extend(storeLatLng);

	        		// Build location information
	        		var $locationInfo = $("<div>").addClass("locationInfo");

	        		// Add extra information to location information to indicate
	        		// the marker that corresponds to the location.
	        		$locationInfo.append(
	        			$("<a>").addClass("mapLocator").attr("href", "#")
	        			.data("store-location-coords", storeLatLngArray)
	        			.data("store-location-marker-index", index)
	        			.text( (index + 1) )
	        		);

	        		// Add location information to location list
	        		$locationList.append($locationInfo);


	        	}
	        );

			// Make the map cover all 10 stores
		    app.lcboLocations.data.map.fitBounds(bounds);

	      }).fail(function(error) {

	      	// Display error message if locations cannot be found.
	      	$listings.append(
	      		$("<div>")
	      			.addClass("errorContentWrap")
	      			.append(
	      				$("<p>").text("Cannot find store locations - please try again later.")
	      			)
	      	);

	      	// Hide loading icon.
	      	$loader.hide();

	        console.log("Error!");
	        console.log(error);
	      });

	});

};

/* Main entry point for JavaScript */
$(function() {
	app.init();

	// Dish name search
	var $dishName = $("input#dishName");
	// Flag to check if dietary restrictions are hidden in the page
	var restrictionsHidden = true;

	// Clear form
	$("#searchForm").on("reset", function(e) {
		$dishName.val("");
	});

	// Search for recipes and wine pairings
	$("#searchForm").on("submit", function(e) {
		if($dishName.val() !== "") {
			e.preventDefault();
			app.getRecipes(true);
		}
	});

	// Show/hide the dietary restrictions panel
	$("#restrictionControl").on("click", function() {

		restrictionsHidden = !restrictionsHidden;

		$("#restrictions").slideToggle("on");
		$("#restrictionControlMode").text(restrictionsHidden ? "Show" : "Hide");

	});

	// Find more recipes after a successful search
	$("#recipeListings").on("click", "#moreRecipes", function(evt) {
		app.getRecipes(false);
	});

	/* Display an individual recipe */
	$("#recipeListings").on("click", "button.recipeButton", function() {

		// Make the application window show
		$(".overlay").fadeIn();
		$(".overlayContent").fadeIn();

		// Display the recipe panel in the application window
		$(".on").removeClass("on");
		$("#recipe").addClass("on");

		// Get the recipe ID.
		var recipeId = $(this).data("recipe-id");

		// Use the recipe ID to find more information about the recipe.
		app.getSingleRecipe(recipeId);
	});

	/* Close the application window */
	$("#closeOverlay").on("click", function() {

		// Fade out the application window 
		$(".overlay").fadeOut();
		$(".overlayContent").fadeOut();
		$(".on").removeClass("on");

		// Clear all information in the application window
		$("#recipe").empty();
		$("#winePairings").empty();
		$("#whereToBuy").empty();
	});

	/* Get wine pairing for a recipe */
	$("#recipe").on("click", "button.findPairings", function() {

		// Display the wine pairings panel in the application window
		$(".on").removeClass("on");
		$("#winePairings").addClass("on");

		// Get dish name and varietal keywords for the wine pairings
		var dishName = $(this).data("dish-name");
		var winePairingKeywords = $(this).data("wine-pairing-keywords");

		// Get wine pairings for the dish with the specified dish name,
		// with the specific varietal keywords
		app.getWinePairings(dishName, winePairingKeywords);

	});

	/* Find the nearest 10 LCBO stores where where a specific wine product can be purchased  */
	$("#winePairings").on("click", ".winePairingInfo button.findLocation", function() {

		// Display the nearest 10 LCBO stores where a specific wine product can be purchased
		$(".on").removeClass("on");
		$("#whereToBuy").addClass("on");

		// Get the name of the wine product and the product ID
		var productName = $(this).data("lcbo-product-name");
		var productId = $(this).data("lcbo-product-id");

		// Get the nearest 10 LCBO stores where a specific wine product can be purchased
		app.getLocationsWithProduct(productName, productId);
	});

	/* Display more information for the nearest 10 LCBO stores with a specific wine product. */
	$("#whereToBuy").on("click", "a.mapLocator", function() {


		// Get the coordinates of the store location that has been clicked on.
		var storeLocationCoords = $(this).data("store-location-coords");
		// Get the index for the store location Google Maps marker
		var storeLocationMarkerIndex = parseInt($(this).data("store-location-marker-index"));

		// Clear any information windows for other stores that are already open in the map.
		app.lcboLocations.data.allOpenedInfoWindows.forEach( function(infoWindow, index, array) {
			infoWindow.close();
		});
		app.lcboLocations.data.allOpenedInfoWindows = [];

		// Set the center of the map to the store location that has been clicked on.
		app.lcboLocations.data.map.setCenter(new google.maps.LatLng(storeLocationCoords[0],
				storeLocationCoords[1]) );

		// Trigger the click event for the store location Google Maps marker (so that it will show the
		// Google Maps information window)
		var locationMarkerToOpen = app.lcboLocations.data.locationMarkers[storeLocationMarkerIndex]
		google.maps.event.trigger(locationMarkerToOpen, 'click');
	});


	/* Go to recipe panel */
	$("#toggleRecipe").on("click", function() {
		$(".on").removeClass("on");
		$("#recipe").addClass("on");
	});

	/* Go to wine pairing panel */
	$("#toggleWinePairing").on("click", function() {
		$(".on").removeClass("on");
		$("#winePairings").addClass("on");
	});

	/* Go to LCBO Location */
	$("#toggleLocation").on("click", function() {
		$(".on").removeClass("on");
		$("#whereToBuy").addClass("on");
	});

});