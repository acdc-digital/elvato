Getting started
Search preview
Meilisearch comes with a built-in search interface for quick testing during development.

Meilisearch Cloud gives you access to a dedicated search preview interface. This is useful to test search result relevancy when you are tweaking an index’s settings.
If you are self-hosting Meilisearch and need a local search interface, access http://localhost:7700 in your browser. This local preview only allows you to perform plain searches and offers no customization options.
​
Accessing and using search preview
Log into your Meilisearch Cloud account, navigate to your project, then click on “Search preview”:
Meilisearch Cloud's project menu with the last option, 'Search preview', selected
Select the index you want to search on using the input on the left-hand side:
Meilisearch Cloud's search preview interface, with the index selecting input highlighted
Then use the main input to perform plain keyword searches:
Meilisearch Cloud's search preview interface, with the search input selected and containing a search string
When debugging relevancy, you may want to activate the “Ranking score” option. This displays the overall ranking score for each result, together with the score for each individual ranking rule:
The same search preview interface as in the previous image, but with the 'Ranking score' option turned on. Search results are the same, but include the document's ranking score
​
Configuring search options
Use the menu on the left-hand side to configure sorting and filtering. These require you to first edit your index’s sortable and filterable attributes. You may additionally configure any filterable attributes as facets. In this example, “Genres” is one of the configured facets:
The sidebar of the search preview interface, with a handful of options, including 'Sort by', 'AI-powered search', 'Filters', and 'Genres'
You can also perform AI-powered searches if this functionality has been enabled for your project.
Clicking on “Advanced parameters” gives you access to further customization options, including setting which document fields Meilisearch returns and explicitly declaring the search language:
The same sidebar as before with the 'Advanced parameters' option highlighted
​
Exporting search options
You can export the full search query for further testing in other tools and environments. Click on the cloud icon next to “Advanced parameters”, then choose to download a JSON file or copy the query to your clipboard:
The same sidebar as before with the 'Export' option highlighted