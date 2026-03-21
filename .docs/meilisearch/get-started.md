Creating an index and adding documents
After creating your project, you must index the data you want to search. Meilisearch stores and processes data you add to it in indexes. A single project may contain multiple indexes.
First, click on the indexes tab in the project page menu:
The project overview page, featuring a secondary menu with several links. A red arrow points at a menu item: 'Indexes'
This leads you to the index listing. Click on “New index”:
An empty list of indexes in this project with a button on the upper right corner
Write movies in the name field and click on “Create Index”:
A modal window with one mandatory field: 'Index name'
The final step in creating an index is to add data to it. Choose “File upload”:
Another modal window with three options. A red arrow points at the chosen option, 'File upload'
Meilisearch Cloud will ask you for your dataset. To follow along, use this list of movies. Download the file to your computer, drag and drop it into the indicated area, then click on “Import documents”:
Another modal window with a large drag-and-drop area. It indicates a file named 'movies.json' will be uploaded
Meilisearch Cloud will index your documents. This may take a moment. Click on “See index list” and wait. Once it is done, click on “Settings” to visit the index overview:
A list of all indexes in this project. It shows a single index, `movies`, and indicates it contains over 30,000 documents
​
Searching
With all data uploaded and processed, the last step is to run a few test searches to confirm Meilisearch is running as expected.
Click on the project name on the breadcrumb menu to return to the project overview:
The index list page. A red arrow points at the breadcrumb menu
Meilisearch Cloud comes with a search preview interface. Click on “Search preview” to access it:
The project overview page. A red arrow points at a menu item named 'Search preview'
Finally, try searching for a few movies, like “Solaris”:
The search preview interface, with 'solaris' written in the search bar
If you can see the results coming in as you type, congratulations: you now know all the basic steps to using Meilisearch Cloud.
​
What’s next
This tutorial taught you how to use Meilisearch Cloud’s interface to create a project, add an index to it, and use the search preview interface.
In most real-life settings, you will be creating your own search interface and retrieving results through Meilisearch’s API. To learn how to add documents and search using the command-line or an SDK in your preferred language, check out the Meilisearch quick start.