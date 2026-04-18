> ## Documentation Index
> Fetch the complete documentation index at: https://docs.bfl.ml/llms.txt
> Use this file to discover all available pages before exploring further.

# Get the user's credits

> Get the user's credits



## OpenAPI

````yaml https://api.bfl.ai/openapi.json get /v1/credits
openapi: 3.1.0
info:
  title: BFL API
  description: Authorize with an API key from your user profile.
  version: 0.0.1
servers:
  - url: https://api.bfl.ai
    description: BFL API
security: []
tags:
  - name: Models
    description: >-
      Generation task endpoints. These endpoints allow you to submit generation
      tasks.
  - name: Utility
    description: >-
      These utility endpoints allow you to check the results of submitted tasks
      and to manage your finetunes.
paths:
  /v1/credits:
    get:
      summary: Get the user's credits
      description: Get the user's credits
      operationId: get_credits_v1_credits_get
      responses:
        '200':
          description: Successful Response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CreditsResponse'
      security:
        - APIKeyHeader: []
components:
  schemas:
    CreditsResponse:
      properties:
        credits:
          type: number
          title: Credits
          description: User's current credit balance
      type: object
      required:
        - credits
      title: CreditsResponse
  securitySchemes:
    APIKeyHeader:
      type: apiKey
      in: header
      name: x-key

````

Built with [Mintlify](https://mintlify.com).

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.bfl.ml/llms.txt
> Use this file to discover all available pages before exploring further.

# Get Result

> An endpoint for getting generation task result.



## OpenAPI

````yaml https://api.bfl.ai/openapi.json get /v1/get_result
openapi: 3.1.0
info:
  title: BFL API
  description: Authorize with an API key from your user profile.
  version: 0.0.1
servers:
  - url: https://api.bfl.ai
    description: BFL API
security: []
tags:
  - name: Models
    description: >-
      Generation task endpoints. These endpoints allow you to submit generation
      tasks.
  - name: Utility
    description: >-
      These utility endpoints allow you to check the results of submitted tasks
      and to manage your finetunes.
paths:
  /v1/get_result:
    get:
      tags:
        - Utility
      summary: Get Result
      description: An endpoint for getting generation task result.
      operationId: get_result_v1_get_result_get
      parameters:
        - name: id
          in: query
          required: true
          schema:
            type: string
            title: Id
      responses:
        '200':
          description: Successful Response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ResultResponse'
        '422':
          description: Validation Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HTTPValidationError'
components:
  schemas:
    ResultResponse:
      properties:
        id:
          type: string
          title: Id
          description: Task id for retrieving result
        status:
          $ref: '#/components/schemas/StatusResponse'
        result:
          anyOf:
            - {}
            - type: 'null'
          title: Result
        progress:
          anyOf:
            - type: number
            - type: 'null'
          title: Progress
        details:
          anyOf:
            - additionalProperties: true
              type: object
            - type: 'null'
          title: Details
        preview:
          anyOf:
            - additionalProperties: true
              type: object
            - type: 'null'
          title: Preview
      type: object
      required:
        - id
        - status
      title: ResultResponse
    HTTPValidationError:
      properties:
        detail:
          items:
            $ref: '#/components/schemas/ValidationError'
          type: array
          title: Detail
      type: object
      title: HTTPValidationError
    StatusResponse:
      type: string
      enum:
        - Task not found
        - Pending
        - Request Moderated
        - Content Moderated
        - Ready
        - Error
      title: StatusResponse
    ValidationError:
      properties:
        loc:
          items:
            anyOf:
              - type: string
              - type: integer
          type: array
          title: Location
        msg:
          type: string
          title: Message
        type:
          type: string
          title: Error Type
      type: object
      required:
        - loc
        - msg
        - type
      title: ValidationError

````

Built with [Mintlify](https://mintlify.com).

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.bfl.ml/llms.txt
> Use this file to discover all available pages before exploring further.

# Finetune Details

> Get details about the training parameters and other metadata connected to a specific finetune_id that was created by the user.



## OpenAPI

````yaml https://api.bfl.ai/openapi.json get /v1/finetune_details
openapi: 3.1.0
info:
  title: BFL API
  description: Authorize with an API key from your user profile.
  version: 0.0.1
servers:
  - url: https://api.bfl.ai
    description: BFL API
security: []
tags:
  - name: Models
    description: >-
      Generation task endpoints. These endpoints allow you to submit generation
      tasks.
  - name: Utility
    description: >-
      These utility endpoints allow you to check the results of submitted tasks
      and to manage your finetunes.
paths:
  /v1/finetune_details:
    get:
      tags:
        - Utility
      summary: Finetune Details
      description: >-
        Get details about the training parameters and other metadata connected
        to a specific finetune_id that was created by the user.
      operationId: finetune_details_v1_finetune_details_get
      parameters:
        - name: finetune_id
          in: query
          required: true
          schema:
            type: string
            title: Finetune Id
      responses:
        '200':
          description: Successful Response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FinetuneDetailResponse'
        '422':
          description: Validation Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HTTPValidationError'
      security:
        - APIKeyHeader: []
      servers:
        - url: https://api.us1.bfl.ai
          description: BFL Finetune API
components:
  schemas:
    FinetuneDetailResponse:
      properties:
        finetune_details:
          additionalProperties: true
          type: object
          title: Finetune Details
          description: Details about the parameters used for finetuning
      type: object
      required:
        - finetune_details
      title: FinetuneDetailResponse
    HTTPValidationError:
      properties:
        detail:
          items:
            $ref: '#/components/schemas/ValidationError'
          type: array
          title: Detail
      type: object
      title: HTTPValidationError
    ValidationError:
      properties:
        loc:
          items:
            anyOf:
              - type: string
              - type: integer
          type: array
          title: Location
        msg:
          type: string
          title: Message
        type:
          type: string
          title: Error Type
      type: object
      required:
        - loc
        - msg
        - type
      title: ValidationError
  securitySchemes:
    APIKeyHeader:
      type: apiKey
      in: header
      name: x-key

````

Built with [Mintlify](https://mintlify.com).> ## Documentation Index
> Fetch the complete documentation index at: https://docs.bfl.ml/llms.txt
> Use this file to discover all available pages before exploring further.

# My Finetunes

> List all finetune_ids created by the user



## OpenAPI

````yaml https://api.bfl.ai/openapi.json get /v1/my_finetunes
openapi: 3.1.0
info:
  title: BFL API
  description: Authorize with an API key from your user profile.
  version: 0.0.1
servers:
  - url: https://api.bfl.ai
    description: BFL API
security: []
tags:
  - name: Models
    description: >-
      Generation task endpoints. These endpoints allow you to submit generation
      tasks.
  - name: Utility
    description: >-
      These utility endpoints allow you to check the results of submitted tasks
      and to manage your finetunes.
paths:
  /v1/my_finetunes:
    get:
      tags:
        - Utility
      summary: My Finetunes
      description: List all finetune_ids created by the user
      operationId: my_finetunes_v1_my_finetunes_get
      responses:
        '200':
          description: Successful Response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MyFinetunesResponse'
      security:
        - APIKeyHeader: []
      servers:
        - url: https://api.us1.bfl.ai
          description: BFL Finetune API
components:
  schemas:
    MyFinetunesResponse:
      properties:
        finetunes:
          items: {}
          type: array
          title: Finetunes
          description: List of finetunes created by the user
      type: object
      required:
        - finetunes
      title: MyFinetunesResponse
  securitySchemes:
    APIKeyHeader:
      type: apiKey
      in: header
      name: x-key

````

Built with [Mintlify](https://mintlify.com).> ## Documentation Index
> Fetch the complete documentation index at: https://docs.bfl.ml/llms.txt
> Use this file to discover all available pages before exploring further.

# Delete Finetune

> Delete a finetune_id that was created by the user



## OpenAPI

````yaml https://api.bfl.ai/openapi.json post /v1/delete_finetune
openapi: 3.1.0
info:
  title: BFL API
  description: Authorize with an API key from your user profile.
  version: 0.0.1
servers:
  - url: https://api.bfl.ai
    description: BFL API
security: []
tags:
  - name: Models
    description: >-
      Generation task endpoints. These endpoints allow you to submit generation
      tasks.
  - name: Utility
    description: >-
      These utility endpoints allow you to check the results of submitted tasks
      and to manage your finetunes.
paths:
  /v1/delete_finetune:
    post:
      tags:
        - Utility
      summary: Delete Finetune
      description: Delete a finetune_id that was created by the user
      operationId: delete_finetune_v1_delete_finetune_post
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DeleteFinetuneInputs'
      responses:
        '200':
          description: Successful Response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DeleteFinetuneResponse'
        '422':
          description: Validation Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HTTPValidationError'
      security:
        - APIKeyHeader: []
      servers:
        - url: https://api.us1.bfl.ai
          description: BFL Finetune API
components:
  schemas:
    DeleteFinetuneInputs:
      properties:
        finetune_id:
          type: string
          title: Finetune Id
          description: ID of the fine-tuned model you want to delete.
          example: my-finetune
      type: object
      required:
        - finetune_id
      title: DeleteFinetuneInputs
    DeleteFinetuneResponse:
      properties:
        status:
          type: string
          title: Status
          description: Status of the deletion
        message:
          type: string
          title: Message
          description: Message about the deletion
        deleted_finetune_id:
          type: string
          title: Deleted Finetune Id
          description: ID of the deleted finetune
        timestamp:
          type: string
          title: Timestamp
          description: Timestamp of the deletion
      type: object
      required:
        - status
        - message
        - deleted_finetune_id
        - timestamp
      title: DeleteFinetuneResponse
    HTTPValidationError:
      properties:
        detail:
          items:
            $ref: '#/components/schemas/ValidationError'
          type: array
          title: Detail
      type: object
      title: HTTPValidationError
    ValidationError:
      properties:
        loc:
          items:
            anyOf:
              - type: string
              - type: integer
          type: array
          title: Location
        msg:
          type: string
          title: Message
        type:
          type: string
          title: Error Type
      type: object
      required:
        - loc
        - msg
        - type
      title: ValidationError
  securitySchemes:
    APIKeyHeader:
      type: apiKey
      in: header
      name: x-key

````

Built with [Mintlify](https://mintlify.com).