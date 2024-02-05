$textFilePath = "itemsList.txt"
$results = @()

Get-Content $textFilePath | ForEach-Object {
    $itemName = $_.Trim()
    $itemName = $itemName -replace 'Spell: ', ''
    $urlEncodedName = $itemName -replace ' ', '_' -replace "'", '%27' -replace '``', '%60'
    $url = "https://wiki.project1999.com/$urlEncodedName"
    Write-Host "Processing: $itemName"
    
    $itemDataContent = $null
    $imgSrc = $null
    $questDataContent = @()

    try {
        $webpageContent = Invoke-WebRequest -Uri $url -TimeoutSec 30
        if ($webpageContent) {
            $itemDataContent = $webpageContent.ParsedHtml.getElementsByClassName('itemdata') | ForEach-Object { $_.innerText }
            $imgSrc = $webpageContent.ParsedHtml.getElementsByTagName('img') | Where-Object { $_.src -like '*Item_*.png' } | Select-Object -First 1 -ExpandProperty src
            if ($imgSrc -notmatch '^http') {
                $imgSrc = "https://wiki.project1999.com$imgSrc"
            }
            $questDataPattern = '(?<=<h2> <span class="mw-headline" id="Related_quests"> Related quests </span></h2>\s*)<ul>([\s\S]*?)<\/ul>'
            if ($webpageContent.Content -match $questDataPattern) {
                $questListHtml = $matches[1]
                [regex]::Matches($questListHtml, '<li>([\s\S]*?)<\/li>') | ForEach-Object {
                    $liContent = $_.Value
                    if ($liContent -match '<a href="([^"]+)".*?>(.*?)<\/a>') {
                        $href = $matches[1]
                        $text = $matches[2] -replace '<[^>]+>', ''
                        $questDataContent += [PSCustomObject]@{
                            QuestName = $text.Trim()
                            QuestLink = "https://wiki.project1999.com$href"
                        }
                    }
                }
            }
        }
        $resultObject = [PSCustomObject]@{
            ItemName  = $itemName
            URL       = $url
            ItemData  = $itemDataContent
            ItemImage = $imgSrc
            QuestData = $questDataContent
        }
        $results += $resultObject
    }
    catch {
        Write-Host "Failed to process: $itemName"
    }
}

$results | ConvertTo-Json -Depth 10 -Compress | Out-File "itemsData.json" -Encoding UTF8
Write-Host "Completed. Data saved to itemsData.json"
