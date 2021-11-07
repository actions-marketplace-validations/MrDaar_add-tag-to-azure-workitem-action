const core = require('@actions/core')
const ado = require('azure-devops-node-api')

const getWorkitemId = (branch) => {
  if (!branch) {
    throw new Error(`missing branch: ${branch}`)
  }

  // refs/heads/1234-this-is-a-branch
  const parts = branch.split('-')
  if (!parts.length) {
    throw new Error(`invalid branch name: ${branch}`)
  }

  const numeric = parts[0].replace(/\D/g, '')
  if (!numeric.length) {
    throw new Error(`invalid workitem id: ${parts[0]}`)
  }

  return parseInt(numeric)
}

async function main() {
  const organization = core.getInput('organization', { required: true })
  const project = core.getInput('project', { required: true })
  const pat = core.getInput('pat', { required: true })
  const field = 'System.Tags'
  const tag = core.getInput('tag', { required: true })
  const branch = core.getInput('branch', { required: true })
  const types = core.getInput('types').split(',').map(x => x.trim().toLowerCase())

  let workitemId
  try {
    workitemId = getWorkitemId(branch)
  } catch (e) {
    core.warning(e)
    return
  }

  const url = `https://dev.azure.com/${organization}`
  const authHandler = ado.getPersonalAccessTokenHandler(pat);
  const connection = new ado.WebApi(url, authHandler);
  const workItemTrackingApi = await connection.getWorkItemTrackingApi();

  const workitem = await workItemTrackingApi.getWorkItem(workitemId);
  if (!workitem) {
    throw new Error(`workitem not found, id: ${workitemId}`)
  }
  // core.info(`workitem = ${JSON.stringify(workitem, null, 4)}`)

  const workItemType = workitem.fields['System.WorkItemType'].toLowerCase()
  if (!types.includes(workItemType)) {
    core.info(`skipping workitem type: ${workItemType}`)
    return
  }

  const currentTags = workitem.fields[field] || 'none'
  const currentTag = currentTags.split(';').find(x => x.trim().toLowerCase() === tag.toLowerCase())
  if (currentTag) {
    core.info(`tag already exists: ${currentTag}`)
    return
  }

  const customHeaders = {}
  const document = [{
    op: 'add',
    path: `/fields/${field}`,
    value: tag
  }]
  const updatedWorkitem = await workItemTrackingApi.updateWorkItem(
    customHeaders,
    document,
    workitemId,
    project
  )
  // core.info(`updatedWorkitem = ${JSON.stringify(updatedWorkitem, null, 4)}`)

  core.info(`tag added to workitem: ${currentTags} => ${updatedWorkitem.fields[field]}`)
}

main().catch(e => core.setFailed(e.message))
