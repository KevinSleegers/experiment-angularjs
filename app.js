var app = angular.module('app', [
		'ui.router',
		'ui.bootstrap',
		'youtube-embed'
	])
	.config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider) {
		// if invalid url, always redirect to the root
		$urlRouterProvider.otherwise('/');

		$stateProvider
			.state('home', {
				url: '/',
				templateUrl: 'templates/home.html',
				controller: function($scope, $state) {
					$scope.title = $state.current.name;
				}
			})
			.state('search', {
				url: '/search',
				templateUrl: 'templates/search.html',				
				controller: function($scope, $state) {
					$scope.title = $state.current.name;
				}
			})
			.state('details', {
				url: '/details',
				templateUrl: 'templates/details.html'
			})
	}]);

app.controller('navController', ['$scope', '$location', function($scope, $location) {
	$scope.isActive = function(viewLocation) {
		var active = viewLocation === $location.path();
		return active;
	};
}]);

app.factory('moviesApi', ['$http', function($http) {

	var keywords = '',
		upcomingMovies = false;

	return {
		// Return all upcoming Movies. Variables: none.
		setUpcomingMovies: function() {
			upcomingMovies = $http.get('https://yts.re/api/upcoming.json');
		},
		getUpcomingMovies: function() {
			return upcomingMovies;
		},
		searchMovies: function(keywords, set) {
			return $http.get('https://yts.re/api/list.json', { params: { keywords : keywords, set : set } });
		},
		movieDetails: function(id) {			
			return $http.get('https://yts.re/api/movie.json', { params: { id : id } });
		},
		setKeywords: function(_keywords_) {
			keywords = _keywords_;
		},
		getKeywords: function() {
			return keywords;
		}
	}
}]);

app.controller('homeController', ['$scope', 'moviesApi', function($scope, moviesApi) {
	$scope.busy = true;
	$scope.upcomingMovies = false;

	if(moviesApi.getUpcomingMovies() == false) {
		moviesApi.setUpcomingMovies();
	}

	moviesApi.getUpcomingMovies()
		.success(function(data, status) {
			$scope.busy = false;

			$scope.upcomingMovies = data.splice(0, 15);
		})
		.error(function(data, status) {
			$scope.upcomingMovies = "oei";
		});	
}]);

app.controller('searchController', ['$scope', '$location', 'moviesApi', function($scope, $location, moviesApi) {
	$scope.oneAtATime = true;
	$scope.set = 1;
	$scope.count = 0;

	$scope.results = [];

	if(moviesApi.getKeywords() !== '') {
		var keywords = moviesApi.getKeywords();

		$scope.searchBusy = true;

		moviesApi.searchMovies(keywords, 1)
			.success(function(data, status) {
				$scope.searchBusy = false;
				$scope.keywords = keywords;
				$scope.results 	= data.MovieList;
				$scope.count 	= data.MovieCount;
				$scope.next 	= (data.MovieCount > 20 ? true : false);
			})
			.error(function(data, status) {
				$scope.results 	= "damn son.";
			});
	}
		
	$scope.search = function() {
		$scope.searchBusy = true;

		moviesApi.setKeywords($scope.keywords);

		moviesApi.searchMovies($scope.keywords, 1)
			.success(function(data, status) {
				$scope.searchBusy = false;
				$scope.results 	= data.MovieList;
				$scope.count 	= data.MovieCount;
				$scope.next 	= (data.MovieCount > 20 ? true : false);
			})
			.error(function(data, status) {
				$scope.results 	= "damn son.";
			});
	}

	$scope.getDetails = function(id) {
		$location.path('details').search({id: id});
	}

	$scope.loadMore = function() {
		var totalSets = Math.ceil($scope.count / 20);

		if($scope.set < totalSets) {
			if($scope.results.length > 0) {
				$scope.set += 1;

				$scope.searchBusy = true;

				moviesApi.searchMovies($scope.keywords, $scope.set)
					.success(function(data, status) {
						$scope.searchBusy = false;
						$scope.results 	= $scope.results.concat(data.MovieList);

						$scope.next = (data.MovieCount > 20 ? true : false);

						console.log('next? = ' + $scope.next);
					})
					.error(function(data, status) {
						$scope.results 	= "damn son.";
					});

			} 
		} else {
			$scope.next = false;
		}
	}
}]);

app.controller('detailsController', ['$scope', '$location', 'moviesApi', function($scope, $location, moviesApi) {
	moviesApi.movieDetails($location.search().id)
		.success(function(data, status) {			
			$scope.details 	= data;
			$scope.youtubeTrailer = data.YoutubeTrailerUrl;
		})
		.error(function(data, status) {
			console.log('error');
		});

	$scope.goBack = function() {
		// Remove id parameter
		delete $location.$$search.id;
		$location.path('search');
	}
}])