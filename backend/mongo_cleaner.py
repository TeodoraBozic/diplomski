from bson import ObjectId

def clean_doc(doc):
    if isinstance(doc, list):
        return [clean_doc(x) for x in doc]

    if isinstance(doc, ObjectId):
        return str(doc)

    if isinstance(doc, dict):
        new = {}
        for k, v in doc.items():
            if isinstance(v, ObjectId):
                new[k] = str(v)
            else:
                new[k] = clean_doc(v)
        return new
    
    return doc
