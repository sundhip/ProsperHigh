from typing import List, Dict, Any, Optional
import re


class DocumentChunkDto:
    def __init__(
        self,
        chunk_index: int,
        content: str,
        section: Optional[str] = None,
        page_number: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.chunk_index = chunk_index
        self.content = content.strip()
        self.section = section
        self.page_number = page_number
        self.metadata = metadata or {}


ChunkDTO = DocumentChunkDto


class SectionChunker:
    """
    Section-aware document chunker for annual reports, earnings calls,
    and exchange filings. Preserves header hierarchy, page numbers, and
    maintains bounded sliding window context.
    """

    def __init__(self, target_chunk_size: int = 400, overlap_size: int = 50):
        self.target_chunk_size = target_chunk_size
        self.overlap_size = overlap_size

    def chunk_document(
        self,
        content: str,
        section: Optional[str] = None,
        page_number: Optional[int] = None,
        extra_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[DocumentChunkDto]:
        """
        Splits document content into structured chunks.
        If content is within target_chunk_size, returns a single chunk.
        Otherwise, chunks by sentences/paragraphs with overlapping boundaries.
        """
        content = content.strip()
        if not content:
            return []

        # Split into sentences or clause blocks
        sentences = re.split(r"(?<=[.!?])\s+", content)
        if len(content) <= self.target_chunk_size or len(sentences) <= 1:
            return [
                DocumentChunkDto(
                    chunk_index=0,
                    content=content,
                    section=section,
                    page_number=page_number,
                    metadata=extra_metadata or {},
                )
            ]

        chunks: List[DocumentChunkDto] = []
        current_chunk_words: List[str] = []
        chunk_idx = 0

        for sentence in sentences:
            sentence_words = sentence.split()
            if len(current_chunk_words) + len(sentence_words) > self.target_chunk_size and current_chunk_words:
                chunk_text = " ".join(current_chunk_words)
                chunks.append(
                    DocumentChunkDto(
                        chunk_index=chunk_idx,
                        content=chunk_text,
                        section=section,
                        page_number=page_number,
                        metadata=extra_metadata or {},
                    )
                )
                chunk_idx += 1
                # Slide window with overlap
                current_chunk_words = current_chunk_words[-self.overlap_size :] + sentence_words
            else:
                current_chunk_words.extend(sentence_words)

        if current_chunk_words:
            chunk_text = " ".join(current_chunk_words)
            chunks.append(
                DocumentChunkDto(
                    chunk_index=chunk_idx,
                    content=chunk_text,
                    section=section,
                    page_number=page_number,
                    metadata=extra_metadata or {},
                )
            )

        return chunks
