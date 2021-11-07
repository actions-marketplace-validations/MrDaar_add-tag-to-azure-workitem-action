# Add Tag to Azure Workitem Action

## Build

```
npm i
npm i -g @vercel/ncc
ncc build index.js
```

`dist/index.js` is regenerated.

## Testing

```
export INPUT_ORGANIZATION=
export INPUT_PROJECT=
export INPUT_PAT=
export INPUT_TAG=Approved
export INPUT_BRANCH=refs/heads/1234-this-is-a-branch
export INPUT_TYPES=Story,Task,Bug

ncc build index.js && node dist/index.js
```

## Example GitHub Action

```yaml
name: Add Tag

on:
  pull_request_review:
    types: [submitted]

jobs:
  add-tag:
    if: github.event.review.state == 'approved'
    runs-on: ubuntu-18.04

    steps:
      - uses: MrDaar/add-tag-to-azure-workitem-action@master
        with:
          organization: myorganization
          project: myproject
          pat: ${{ secrets.ADO_ADD_TAG_PAT }}
          tag: Approved
          branch: ${{ github.event.pull_request.base.ref }}
```
