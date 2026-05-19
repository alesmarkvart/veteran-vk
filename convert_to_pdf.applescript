set issuesFolder to "/Users/alesmarkvart/RustroverProjects/veterani-vk/issues/"
set docFiles to {"issue-1.docx", "issue-2.docx", "issue-3.docx", "issue-4.docx", "issue-5.docx", "issue-6.docx", "issue-7.docx", "issue-8.docx", "issue-9.docx"}

tell application "Microsoft Word"
  repeat with docName in docFiles
    set docPath to issuesFolder & docName
    set pdfName to text 1 thru -6 of docName & ".pdf"
    set pdfPath to issuesFolder & pdfName
    set wdDoc to open POSIX file docPath
    save as wdDoc file name pdfPath file format format PDF
    close wdDoc saving no
  end repeat
end tell

return "Done"
