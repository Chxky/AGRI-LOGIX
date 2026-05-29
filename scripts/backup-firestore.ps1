param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectId,

  [Parameter(Mandatory = $true)]
  [string]$BucketUrl,

  [string[]]$CollectionIds = @(),

  [string]$NamespaceIds = ""
)

# Usage:
#   .\backup-firestore.ps1 -ProjectId "agri-logix" -BucketUrl "gs://agri-logix-backups"
#   .\backup-firestore.ps1 -ProjectId "agri-logix" -BucketUrl "gs://agri-logix-backups" -CollectionIds @("seedBags","farmers")
#
# Prerequisites:
#   gcloud CLI installed and authenticated
#   Service account has roles/datastore.importExportAdmin on the project
#   GCS bucket exists in the same region as Firestore

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$exportUri = "$BucketUrl/backups/$timestamp"

$cmd = "gcloud", "firestore", "export", $exportUri, "--project=$ProjectId", "--async"

if ($CollectionIds.Count -gt 0) {
  $cmd += "--collection-ids=$($CollectionIds -join ',')"
}

if ($NamespaceIds) {
  $cmd += "--namespace-ids=$NamespaceIds"
}

Write-Host "Starting Firestore export to $exportUri ..."
Write-Host "Command: $($cmd -join ' ')"
Write-Host ""

& $cmd

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "Export initiated successfully."
  Write-Host "Check status via: gcloud firestore operations list --project=$ProjectId"
  Write-Host "Output location: $exportUri"
} else {
  Write-Host "ERROR: Export failed. Check the error above."
  exit 1
}
