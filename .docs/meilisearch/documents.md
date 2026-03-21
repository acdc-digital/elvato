Getting started
Documents
Documents are the individual items that make up a dataset. Each document is an object composed of one or more fields.

A document is an object composed of one or more fields. Each field consists of an attribute and its associated value. Documents function as containers for organizing data and are the basic building blocks of a Meilisearch database. To search for a document, you must first add it to an index.
Nothing will be shared between two indexes if they contain the exact same document. Instead, both documents will be treated as different documents. Depending on the index’s settings, the documents might have different sizes.
​
Structure
Diagram illustration Meilisearch's document structure
​
Important terms
Document: an object which contains data in the form of one or more fields
Field: a set of two data items that are linked together: an attribute and a value
Attribute: the first part of a field. Acts as a name or description for its associated value
Value: the second part of a field, consisting of data of any valid JSON type
Primary Field: a special field that is mandatory in all documents. It contains the primary key and document identifier
​
Fields
A field is a set of two data items linked together: an attribute and a value. Documents are made up of fields.
An attribute is a case-sensitive string that functions as a field’s name and allows you to store, access, and describe data.
That data is the field’s value. Every field has a data type dictated by its value. Every value must be a valid JSON data type.
If the value is a string, it can contain at most 65535 positions. Words exceeding the 65535 position limit will be ignored.
If a field contains an object, Meilisearch flattens it during indexing using dot notation and brings the object’s keys and values to the root level of the document itself. This flattened object is only an intermediary representation—you will get the original structure upon search. You can read more about this in our dedicated guide.
With ranking rules, you can decide which fields are more relevant than others. For example, you may decide recent movies should be more relevant than older ones. You can also designate certain fields as displayed or searchable.
Some features require Meilisearch to reserve attributes. For example, to use geosearch functionality your documents must include a _geo field.
Reserved attributes are always prefixed with an underscore (_).
​
Displayed and searchable fields
By default, all fields in a document are both displayed and searchable. Displayed fields are contained in each matching document, while searchable fields are searched for matching query words.
You can modify this behavior using the update settings endpoint, or the respective update endpoints for displayed attributes, and searchable attributes so that a field is:
Searchable but not displayed
Displayed but not searchable
Neither displayed nor searchable
In the latter case, the field will be completely ignored during search. However, it will still be stored in the document.
To learn more, refer to our displayed and searchable attributes guide.
​
Primary field
The primary field is a special field that must be present in all documents. Its attribute is the primary key and its value is the document id. If you try to index a document that’s missing a primary key or possessing the wrong primary key for a given index, it will cause an error and no documents will be added.
To learn more, refer to the primary key explanation.
​
Upload
By default, Meilisearch limits the size of all payloads—and therefore document uploads—to 100MB. You can change the payload size limit at runtime using the http-payload-size-limit option.
Meilisearch uses a lot of RAM when indexing documents. Be aware of your RAM availability as you increase your batch size as this could cause Meilisearch to crash.
When using the add new documents endpoint, ensure:
The payload format is correct. There are no extraneous commas, mismatched brackets, missing quotes, etc.
All documents are sent in an array, even if there is only one document
​
Dataset format
Meilisearch accepts datasets in the following formats:
JSON
NDJSON
CSV
​
JSON
Documents represented as JSON objects are key-value pairs enclosed by curly brackets. As such, any rule that applies to formatting JSON objects also applies to formatting Meilisearch documents. For example, an attribute must be a string, while a value must be a valid JSON data type.
Meilisearch will only accept JSON documents when it receives the application/json content-type header.
As an example, let’s say you are creating an index that contains information about movies. A sample document might look like this:
{
  "id": 1564,
  "title": "Kung Fu Panda",
  "genres": "Children's Animation",
  "release-year": 2008,
  "cast": [
    { "Jack Black": "Po" },
    { "Jackie Chan": "Monkey" }
  ]
}
In the above example:
"id", "title", "genres", "release-year", and "cast" are attributes
Each attribute is associated with a value, for example, "Kung Fu Panda" is the value of "title"
The document contains a field with the primary key attribute and a unique document id as its value: "id": "1564"
​
NDJSON
NDJSON or jsonlines objects consist of individual lines where each individual line is valid JSON text and each line is delimited with a newline character. Any rules that apply to formatting NDJSON also apply to Meilisearch documents.
Meilisearch will only accept NDJSON documents when it receives the application/x-ndjson content-type header.
Compared to JSON, NDJSON has better writing performance and is less CPU and memory intensive. It is easier to validate and, unlike CSV, can handle nested structures.
The above JSON document would look like this in NDJSON:
{ "id": 1564, "title": "Kung Fu Panda", "genres": "Children's Animation", "release-year": 2008, "cast": [{ "Jack Black": "Po" }, { "Jackie Chan": "Monkey" }] }
​
CSV
CSV files express data as a sequence of values separated by a delimiter character. Meilisearch accepts string, boolean, and number data types for CSV documents. If you don’t specify the data type for an attribute, it will default to string. Empty fields such as ,, and , , will be considered null.
By default, Meilisearch uses a single comma (,) as the delimiter. Use the csvDelimiter query parameter with the add or update documents or add or replace documents endpoints to set a different character. Any rules that apply to formatting CSV also apply to Meilisearch documents.
Meilisearch will only accept CSV documents when it receives the text/csv content-type header.
Compared to JSON, CSV has better writing performance and is less CPU and memory intensive.
The above JSON document would look like this in CSV:
  "id:number","title:string","genres:string","release-year:number"
  "1564","Kung Fu Panda","Children's Animation","2008"
Since CSV does not support arrays or nested objects, cast cannot be converted to CSV.
​
Auto-batching
Auto-batching combines similar operations in the same index into a single batch, then processes them together. This significantly speeds up the indexing process.
Tasks within the same batch share the same values for startedAt, finishedAt, and duration.
If a task fails due to an invalid document, it will be removed from the batch. The rest of the batch will still process normally. If an internal error occurs, the whole batch will fail and all tasks within it will share the same error object.
​
Auto-batching and task cancellation
If the task you’re canceling is part of a batch, Meilisearch interrupts the whole process, discards all progress, and cancels that task. Then, it automatically creates a new batch without the canceled task and immediately starts processing it.