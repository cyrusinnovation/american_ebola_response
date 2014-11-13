require 'csv'

@file_name = ARGV[0]
file = File.new('inputs/' + @file_name, 'r')
n_lines = 0

@headers = nil
@contents = {}
@dates = []

def parse_headers(fields)
	@headers = fields.slice(1..(fields.length-1))
	@headers = @headers.map(&:chomp)

	@headers.each do |name|
		@contents[name] = []
	end
end

def parse_line(fields)
	@dates << fields[0]
	@headers.each_with_index do |name, i|
		@contents[name] << fields[i + 1].chomp.to_f
	end
end

file.each_line do |line|
	fields = line.split(',')

	if (@headers)
		break unless fields.length == (@headers.length + 1)
		next if fields.last =~ /^\s*$/

		parse_line(fields)
	elsif (fields[0] == 'Day')
		parse_headers(fields)
	end
end

def normalize_for_ebola
	return unless @headers.include?('ebola')

	peak_ebola = @contents['ebola'].max
	@contents.keys.each do |key|
		@contents[key] = @contents[key].map { |value| value * 100 / peak_ebola }
	end
end

def header
	['Name'] + @dates
end

def write_contents
	CSV.open("outputs/#{@file_name}", 'w') do |writer|
		writer << header
		@contents.each do |key, values|
			writer << [key] + values
		end
	end
end

normalize_for_ebola
write_contents
